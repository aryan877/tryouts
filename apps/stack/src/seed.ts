import { join } from "node:path";
import { type Gateway, HttpError, type Mattermost } from "@tryouts/switch";
import { chatPlan, claimOnApp, ensureBridges } from "./chat";
import {
  AGENTS,
  ARJUN,
  BIN_DIR,
  MACHINE,
  MODEL,
  ORIGIN,
  PEOPLE,
  type PersonKey,
  ROOMS,
  SWITCH_URL,
  TRYOUTS_CONFIG,
  WEB_ENV,
} from "./config";
import { enroll, installController, start } from "./controllers";
import { admins } from "./infra";
import {
  installLauncher,
  prepareFolders,
  runOnce,
  saveTemplate,
  TEMPLATE,
  writeConfig,
} from "./install";
import { prepareOrigin } from "./repos";
import { step, waitFor } from "./shell";
import { infraEnv, loadState } from "./state";

export async function seed(): Promise<void> {
  const state = await loadState();
  const admin = await admins();
  const plan = chatPlan();
  await ensureBridges(admin.gateway, plan);
  const teamId = await admin.mattermost.teamId(admin.team);
  const people = {} as Record<PersonKey, Gateway>;
  for (const key of Object.keys(PEOPLE) as PersonKey[]) {
    people[key] = await ensurePerson(
      key,
      state.passwords[key],
      admin.gateway,
      admin.mattermost,
      teamId,
    );
  }
  const { lead: arjun, community: riya } = people;
  const env = await infraEnv();

  await installController();
  await enroll(arjun);
  await start();
  await prepareOrigin();
  const folders = await prepareFolders(ARJUN);
  await installLauncher(join(BIN_DIR, "tryouts"), TRYOUTS_CONFIG);
  await writeConfig(TRYOUTS_CONFIG, {
    switch: { url: SWITCH_URL, email: PEOPLE.lead.email, password: state.passwords.lead },
    admin: { email: env.GATEWAY_ADMIN_EMAIL, password: env.GATEWAY_ADMIN_PASSWORD },
    repository: ORIGIN,
    bench: folders.bench,
    rooms: ROOMS,
  });
  await claimOnApp(arjun, plan.lead);
  await claimOnApp(riya, plan.community);
  await machineReady(arjun);

  step(
    `${PEOPLE.community.name} opens the public ${ROOMS.bugs} room on ${plan.community.displayName}`,
  );
  await runOnce(riya, TEMPLATE.bugs, () => hasRoom(riya, ROOMS.bugs), {
    app: plan.community.displayName,
  });
  step(`${PEOPLE.lead.name} saves the tryout template and runs the team template`);
  await saveTemplate(arjun, TEMPLATE.tryout);
  await runOnce(arjun, TEMPLATE.team, () => hasAgent(arjun, AGENTS.hiring.name), {
    repository: ORIGIN,
    team_app: plan.lead.displayName,
    bench: folders.bench,
    hiring_directory: folders.hiring,
    referee_directory: folders.referee,
    tryout_template: TEMPLATE.tryout.name,
    model: MODEL,
    machine: MACHINE,
  });
  await Bun.write(
    WEB_ENV,
    [
      `SWITCH_URL=${SWITCH_URL}`,
      `SWITCH_EMAIL=${PEOPLE.lead.email}`,
      `SWITCH_PASSWORD=${state.passwords.lead}`,
      `TRYOUTS_CONFIG=${TRYOUTS_CONFIG}`,
      "",
    ].join("\n"),
  );
}

const hasRoom = async (gateway: Gateway, name: string) =>
  (await gateway.rooms()).some((room) => room.name === name);

const hasAgent = async (gateway: Gateway, name: string) =>
  (await gateway.agents()).some((agent) => agent.name === name);

async function ensurePerson(
  key: PersonKey,
  password: string,
  admin: Gateway,
  mattermost: Mattermost,
  teamId: string,
): Promise<Gateway> {
  const person = PEOPLE[key];
  await admin.createUser(person.name, person.email, password).catch(ignore(409));
  const gateway = await admin.loginAs(person.email, password);
  const chatUser = await mattermost.ensureUser(person.chat, password, person.name, teamId);
  const [bridge] = (await gateway.bridges()).filter((b) => b.bridge_type === "mattermost");
  if (!bridge) throw new Error("Switch has no Mattermost bridge.");
  const linked = (await gateway.identities()).some(
    (identity) =>
      identity.bridge_id === bridge.bridge_id && identity.external_user_id === chatUser.id,
  );
  if (!linked) {
    step(`Linking ${person.name}'s Mattermost account to Switch`);
    await waitFor(
      "the Mattermost directory to list the new account",
      () => gateway.claimIdentity(bridge.bridge_id, chatUser.id, person.chat),
      60_000,
    );
  }
  return gateway;
}

function machineReady(owner: Gateway) {
  return waitFor(
    `${MACHINE} to report OpenCode installed`,
    async () =>
      (await owner.controllers()).find(
        (c) =>
          c.name === MACHINE &&
          c.state === "online" &&
          c.status?.providers?.some((p) => p.provider === "opencode" && p.installed),
      ),
    120_000,
  );
}

const TRYOUT_ROOM = /^tryout-\d+-/;

export async function retireRooms(): Promise<void> {
  const admin = await admins().catch(() => null);
  if (!admin) {
    console.warn("Switch is not running, so the Tryouts channels stay on the chat apps.");
    return;
  }
  const ours = new Set<string>(Object.values(ROOMS));
  const rooms = (await admin.gateway.rooms()).filter(
    (room) => ours.has(room.name) || TRYOUT_ROOM.test(room.name),
  );
  if (rooms.length === 0) return;
  step("Retiring the Tryouts channels");
  for (const room of rooms) await admin.gateway.deleteRoom(room.id).catch(ignore(404));
}

const ignore =
  (status: number) =>
  (error: unknown): void => {
    if (!(error instanceof HttpError && error.status === status)) throw error;
  };
