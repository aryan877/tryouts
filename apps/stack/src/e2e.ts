import { ALIAS, parseCandidate } from "@tryouts/kit";
import { commandOf, Gateway, Mattermost, type Post } from "@tryouts/switch";
import { chatPlan } from "./chat";
import { AGENTS, GITHUB_REPO, ISSUES, MATTERMOST_URL, PEOPLE, ROOMS, SWITCH_URL } from "./config";
import { admins } from "./infra";
import { mirror } from "./repos";
import { sh, step, waitFor } from "./shell";
import { loadState } from "./state";

const MINUTE = 60_000;
const LINEUP =
  process.env.TRYOUTS_LINEUP === "all"
    ? "with Claude Code, Codex and OpenCode"
    : "with two OpenCode models: opencode-go/deepseek-v4.1-flash and opencode-go/qwen3.8-flash";
const { tryout: TRYOUT, probation: BUG } = ISSUES;

type Named = Post & { author: string };

class Channel {
  private readonly names = new Map<string, string>();
  private readonly printed = new Set<string>();
  readonly started = Date.now();

  constructor(
    readonly reader: Mattermost,
    readonly id: string,
    readonly label: string,
  ) {}

  async posts(): Promise<Named[]> {
    const named: Named[] = [];
    for (const post of await this.reader.posts(this.id, this.started - 1_000)) {
      if (!this.names.has(post.user_id)) {
        this.names.set(post.user_id, await this.reader.username(post.user_id));
      }
      const author = this.names.get(post.user_id) as string;
      if (post.message.trim() && !this.printed.has(post.id)) {
        this.printed.add(post.id);
        console.log(
          `  \x1b[2m[${this.label}] ${author}:\x1b[0m ${post.message.split("\n")[0]?.slice(0, 150)}`,
        );
      }
      named.push({ ...post, author });
    }
    return named;
  }

  find(
    what: string,
    match: (post: Named) => boolean,
    timeoutMs: number,
    meanwhile?: () => Promise<void>,
  ) {
    return waitFor(
      what,
      async () => {
        await meanwhile?.();
        return (await this.posts()).findLast(match);
      },
      timeoutMs,
      4_000,
    );
  }
}

const EXPECTED =
  /^tryouts ((hire|merge) --agent [a-z0-9-]+ --issue \d+ --sha [0-9a-f]{40}|fire --agent [a-z0-9-]+ --issue \d+)$/;

const both =
  (...steps: (() => Promise<void>)[]) =>
  async () => {
    for (const run of steps) await run();
  };

class Desk {
  private readonly answered = new Set<string>();

  constructor(
    readonly owner: Gateway,
    readonly person: Mattermost,
    readonly channel: Channel,
    readonly agentId: string,
  ) {}

  private open = async () =>
    (await this.owner.openApprovals()).filter((card) => card.state === "open");

  answerOthers = async () => {
    const names = new Map((await this.owner.agents()).map((agent) => [agent.id, agent.name]));
    for (const card of await this.open()) {
      const command = commandOf(card);
      const name = names.get(card.agentId) ?? card.agentId;
      if (this.answered.has(card.requestId)) continue;
      if (card.agentId === this.agentId) {
        if (EXPECTED.test(command)) continue;
        this.answered.add(card.requestId);
        step(`${PEOPLE.lead.name} denies a command he did not expect: ${command}`);
        await this.owner.answerApproval(card, "decline");
        await this.person.post(
          this.channel.id,
          `@${AGENTS.hiring.name} I denied \`${command}\`. Run no command except the tryouts commands in your instructions, exactly as written.`,
        );
      } else if (parseCandidate(name)) {
        this.answered.add(card.requestId);
        step(
          `${PEOPLE.lead.name} allows ${name} to work: ${command.split("\n")[0]?.slice(0, 100)}`,
        );
        await this.owner.answerApproval(card, "accept");
      }
    }
  };

  async allow(prefix: string, timeoutMs: number, meanwhile: () => Promise<void>): Promise<string> {
    const card = await waitFor(
      `the approval card for ${prefix}`,
      async () => {
        await both(meanwhile, this.answerOthers)();
        return (await this.open()).find(
          (open) =>
            open.agentId === this.agentId &&
            EXPECTED.test(commandOf(open)) &&
            commandOf(open).startsWith(prefix),
        );
      },
      timeoutMs,
      4_000,
    );
    const command = commandOf(card);
    step(`${PEOPLE.lead.name} allows: ${command}`);
    const answered = await this.owner.answerApproval(card, "accept");
    if (answered.state !== "answered")
      throw new Error(`Switch did not record the answer: ${answered.state}`);
    return command;
  }
}

function refereeWatch(
  arjun: Mattermost,
  hiring: Channel,
  gateway: Gateway,
  issue: number,
  teamId: string,
) {
  const nudged = new Set<string>();
  return async () => {
    const me = await gateway.me();
    const rooms = (await gateway.rooms()).filter((room) =>
      room.name.startsWith(`tryout-${issue}-`),
    );
    for (const room of rooms) {
      await gateway.joinChat(room.id, me.id).catch(() => undefined);
      const messages = await gateway.chatMessages(room.id);
      const last = messages.at(-1);
      if (
        last?.sender.kind === "agent" &&
        last.body.includes("The turn failed") &&
        !nudged.has(last.messageId)
      ) {
        nudged.add(last.messageId);
        step(`${last.sender.name}'s turn failed upstream; ${PEOPLE.lead.name} asks it to carry on`);
        await arjun.post(
          await arjun.channelId(teamId, room.name),
          `@${last.sender.name} your last turn failed upstream. Please carry on with the tryout.`,
        );
      }
      const ready = messages.findLast(
        (m) => m.sender.kind === "agent" && m.body.includes("Ready:"),
      );
      if (!ready || nudged.has(ready.messageId)) continue;
      const checked = messages.some(
        (m) =>
          m.sender.name === AGENTS.referee.name &&
          Date.parse(m.sentAt) > Date.parse(ready.sentAt) &&
          m.body.includes("**Referee ·"),
      );
      if (checked || Date.now() - Date.parse(ready.sentAt) < 4 * MINUTE) continue;
      nudged.add(ready.messageId);
      step(
        `No card for ${ready.sender.name} after 4 minutes; ${PEOPLE.lead.name} nudges the referee`,
      );
      await arjun.post(
        hiring.id,
        `@${AGENTS.referee.name} ${ready.sender.name} said Ready in its tryout room, but there is no card yet. Please check it for #${issue}.`,
      );
    }
  };
}

function confirmDeletions(person: Mattermost, channel: Channel, losers: string[]) {
  const sent = new Set<string>();
  return async () => {
    for (const post of await channel.posts()) {
      for (const loser of losers) {
        const confirm = `!delete-agent ${loser} confirm`;
        if (
          sent.has(loser) ||
          post.author === PEOPLE.lead.chat ||
          !post.message.includes(confirm)
        ) {
          continue;
        }
        sent.add(loser);
        step(`${PEOPLE.lead.name} confirms: ${confirm}`);
        await person.post(channel.id, confirm);
      }
    }
  };
}

export async function e2e(): Promise<void> {
  const plan = chatPlan();
  if (plan.lead.kind !== "mattermost" || plan.community.kind !== "mattermost") {
    throw new Error(
      "The automated run plays both people on Mattermost; unset the Slack and Discord variables in .env, or play it yourself.",
    );
  }
  const state = await loadState();
  const { team } = await admins();
  const [arjun, riya, switchAsArjun, switchAsRiya] = await Promise.all([
    Mattermost.login(MATTERMOST_URL, PEOPLE.lead.chat, state.passwords.lead),
    Mattermost.login(MATTERMOST_URL, PEOPLE.community.chat, state.passwords.community),
    Gateway.login(SWITCH_URL, PEOPLE.lead.email, state.passwords.lead),
    Gateway.login(SWITCH_URL, PEOPLE.community.email, state.passwords.community),
  ]);
  const teamId = await arjun.teamId(team);
  const open = async (reader: Mattermost, name: string) =>
    new Channel(
      reader,
      await waitFor(
        `the ${name} channel`,
        () => reader.channelId(teamId, name).catch(() => null),
        5 * MINUTE,
        3_000,
      ),
      name,
    );
  const [hiring, bugs] = await Promise.all([open(arjun, ROOMS.hiring), open(riya, ROOMS.bugs)]);
  const hiringId = (await switchAsArjun.agents()).find(
    (agent) => agent.name === AGENTS.hiring.name,
  )?.id;
  if (!hiringId) throw new Error(`Switch has no ${AGENTS.hiring.name} agent.`);
  const desk = new Desk(switchAsArjun, arjun, hiring, hiringId);

  step(`${PEOPLE.lead.name} posts a job in #${ROOMS.hiring}`);
  await arjun.post(
    hiring.id,
    `@${AGENTS.hiring.name} we need a bug fixer for tinychunk. Hold a tryout on #${TRYOUT.number} (${TRYOUT.title}) ${LINEUP}.`,
  );
  await hiring.find(
    "the referee to set the budgets",
    (post) =>
      post.author === AGENTS.referee.name &&
      post.message.includes(`**Tryout #${TRYOUT.number} · budgets set in Switch**`),
    10 * MINUTE,
    desk.answerOthers,
  );
  const board = await hiring.find(
    "the referee's scoreboard with a suggested hire",
    (post) => post.author === AGENTS.referee.name && post.message.includes("Suggested hire: **"),
    30 * MINUTE,
    both(refereeWatch(arjun, hiring, switchAsArjun, TRYOUT.number, teamId), desk.answerOthers),
  );
  const candidates = [...board.message.matchAll(/^\d+\. \*\*([a-z0-9-]+)\*\*/gm)].map(
    (m) => m[1] as string,
  );
  step(`Scoreboard: ${candidates.join(", ")}`);

  const command = await desk.allow("tryouts hire", 10 * MINUTE, async () => undefined);
  const hired = /--agent ([a-z0-9-]+)/.exec(command)?.[1] as string;
  const losers = candidates.filter((name) => name !== hired);
  const cleanup = both(confirmDeletions(arjun, hiring, losers), desk.answerOthers);
  await hiring.find(
    "the hire record",
    (post) => post.author === AGENTS.hiring.name && post.message.includes(`**Hired · ${hired}**`),
    5 * MINUTE,
    cleanup,
  );
  const refusal = await hiring.find(
    "the hiring manager to report Switch's refusal",
    (post) => post.author === AGENTS.hiring.name && post.message.includes("!invite-agent"),
    5 * MINUTE,
    cleanup,
  );
  const bugsRoom = (await switchAsRiya.rooms()).find((room) => room.name === ROOMS.bugs);
  const hireId = (await switchAsArjun.agents()).find((agent) => agent.name === hired)?.id;
  if (!bugsRoom || !hireId) throw new Error(`#${ROOMS.bugs} or ${hired} is missing in Switch.`);
  if ((await switchAsRiya.room(bugsRoom.id)).agent_ids.includes(hireId)) {
    throw new Error(`Switch let ${hired} into #${ROOMS.bugs}: ${refusal.message}`);
  }
  step(
    `Switch kept ${hired} out of #${ROOMS.bugs}; ${PEOPLE.community.name}, who owns it, lets it in and names it @${ALIAS}`,
  );

  await switchAsRiya.addAgentsToRoom(bugsRoom.id, [hireId]);

  await waitFor(
    "Switch to set the alias",
    async () => {
      const said = await riya.post(bugs.id, `!set-alias @${hired} @${ALIAS}`);
      return bugs
        .find(
          "the alias reply",
          (post) => post.create_at > said.create_at && post.message.startsWith("Alias set"),
          20_000,
          cleanup,
        )
        .catch(() => null);
    },
    2 * MINUTE,
    0,
  );
  await waitFor(
    `Switch to delete ${losers.join(", ")}`,
    async () => {
      await cleanup();
      const left = new Set((await switchAsArjun.agents()).map((agent) => agent.name));
      return losers.every((name) => !left.has(name));
    },
    6 * MINUTE,
    4_000,
  );
  step(`${losers.join(", ")} deleted on ${PEOPLE.lead.name}'s confirm`);

  step(`${PEOPLE.community.name} reports #${BUG.number} to @${ALIAS} in #${ROOMS.bugs}`);
  await riya.post(
    bugs.id,
    `@${ALIAS} #${BUG.number} ${BUG.title}: ${BUG.body.replaceAll("`", "")}${GITHUB_REPO ? ` https://github.com/${GITHUB_REPO}/issues/${BUG.number}` : ""}`,
  );
  await desk.allow(
    `tryouts merge --agent ${hired} --issue ${BUG.number}`,
    30 * MINUTE,
    async () => undefined,
  );
  await hiring.find(
    "the probation merge",
    (post) => post.message.includes(`**Merged · #${BUG.number} by ${hired}**`),
    5 * MINUTE,
  );

  await bugs.find(
    `${hired} telling ${PEOPLE.community.name} after the merge`,
    (post) => post.author === hired && post.message.includes(`#${BUG.number}`),
    5 * MINUTE,
  );

  const history = await sh(["git", "log", "-3", "--format=%B", "main"], await mirror());
  for (const line of [`Hired: ${hired}`, "Probation: 1 of 3"]) {
    if (!history.includes(line))
      throw new Error(`origin/main does not record "${line}":\n${history}`);
  }
  step("origin/main records the hire and probation 1 of 3 in its commit trailers");
  const elapsed = Math.round((Date.now() - hiring.started) / 1000);
  console.log(`\n\x1b[32m✔ Tryouts end to end in ${elapsed}s\x1b[0m`);
}
