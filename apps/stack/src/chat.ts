import { PEOPLE, type PersonKey } from "@tryouts/kit";
import type { AppKind, Bridge, Gateway } from "@tryouts/switch";
import { step, waitFor } from "./shell";

export interface PersonApp {
  kind: AppKind;
  displayName: string;
  handle: string;
  connection: Record<string, string | boolean> | null;
}

const MATTERMOST = "Mattermost";

function required(names: string[]): Record<string, string> | null {
  const values = Object.fromEntries(names.map((name) => [name, process.env[name] ?? ""]));
  const set = names.filter((name) => values[name]);
  if (set.length === 0) return null;
  if (set.length < names.length) {
    const missing = names.filter((name) => !values[name]).join(", ");
    throw new Error(`Set all of ${names.join(", ")} in .env, or none. Missing: ${missing}.`);
  }
  return values;
}

export function chatPlan(): Record<PersonKey, PersonApp> {
  const discord = required(["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID", "DISCORD_USER"]);
  const slack = required([
    "SLACK_BOT_TOKEN",
    "SLACK_APP_TOKEN",
    "SLACK_WORKSPACE_ID",
    "SLACK_USER",
  ]);
  const mattermost = (person: PersonKey): PersonApp => ({
    kind: "mattermost",
    displayName: MATTERMOST,
    handle: PEOPLE[person].chat,
    connection: null,
  });
  return {
    community: discord
      ? {
          kind: "discord",
          displayName: "Discord",
          handle: discord.DISCORD_USER as string,
          connection: {
            bot_token: discord.DISCORD_BOT_TOKEN as string,
            guild_id: discord.DISCORD_GUILD_ID as string,
            agent_roles: false,
          },
        }
      : mattermost("community"),
    lead: slack
      ? {
          kind: "slack",
          displayName: "Slack",
          handle: slack.SLACK_USER as string,
          connection: {
            bot_token: slack.SLACK_BOT_TOKEN as string,
            app_token: slack.SLACK_APP_TOKEN as string,
            workspace_id: slack.SLACK_WORKSPACE_ID as string,
            agent_usergroups: false,
          },
        }
      : mattermost("lead"),
  };
}

export async function ensureBridges(
  admin: Gateway,
  plan: Record<PersonKey, PersonApp>,
): Promise<void> {
  for (const app of Object.values(plan)) {
    if (!app.connection) continue;
    const existing = (await admin.bridges()).find((b) => b.display_name === app.displayName);
    if (existing) continue;
    step(`Connecting ${app.displayName} to Switch`);
    await admin.registerBridge(app.kind, app.displayName, app.connection);
  }
  const all = await admin.bridges();
  for (const bridge of all.filter((b) => b.agent_greetings_enabled)) {
    await admin.setAgentGreetings(bridge.bridge_id, false);
  }
}

export async function bridgeFor(gateway: Gateway, app: PersonApp): Promise<Bridge> {
  const bridge = (await gateway.bridges()).find((b) => b.display_name === app.displayName);
  if (!bridge) throw new Error(`Switch has no "${app.displayName}" connection.`);
  return bridge;
}

export async function claimOnApp(gateway: Gateway, app: PersonApp): Promise<string> {
  const bridge = await bridgeFor(gateway, app);
  const linked = (await gateway.identities()).find((i) => i.bridge_id === bridge.bridge_id);
  if (linked) return linked.id;
  const user = await waitFor(
    `${app.handle} in the ${app.displayName} directory`,
    () => gateway.findPlatformUser(bridge.bridge_id, app.handle),
    60_000,
  );
  step(`Linking ${app.handle} on ${app.displayName}`);
  const claim = await gateway.claimIdentity(bridge.bridge_id, user.external_user_id, user.username);
  return claim.id;
}
