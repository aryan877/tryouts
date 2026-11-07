import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { AGENTS, ALIAS, VENDORS } from "@tryouts/kit";
import { merge } from "@tryouts/referee";
import {
  type Agent,
  type ApprovalRecord,
  commandOf,
  type Gateway,
  HttpError,
} from "@tryouts/switch";
import { slotOf } from "./bench";
import { candidatesOf, collect, type Entry, numbers, rank, tenantOf } from "./board";
import { type Accounts, type Config, repoName, STATE_DIR } from "./config";

export interface Fix {
  issue: number;
  sha: string;
  merged: string;
  digest: string;
  approval: string;
  at: string;
}

export interface HireRecord {
  agent: string;
  label: string;
  repository: string;
  tryout: number;
  hiredAt: string;
  hiredBy: string;
  hire: Fix;
  board: Entry[];
  probation: Fix[];
}

const recordFile = (agent: string) => join(STATE_DIR, "hires", `${agent}.json`);

async function saveRecord(record: HireRecord): Promise<void> {
  await mkdir(join(STATE_DIR, "hires"), { recursive: true });
  await Bun.write(recordFile(record.agent), `${JSON.stringify(record, null, 2)}\n`);
}

export async function loadRecord(agent: string): Promise<HireRecord | null> {
  const file = Bun.file(recordFile(agent));
  return (await file.exists()) ? ((await file.json()) as HireRecord) : null;
}

const short = (sha: string) => sha.slice(0, 7);

async function hireRecords(): Promise<HireRecord[]> {
  const files = await readdir(join(STATE_DIR, "hires")).catch(() => [] as string[]);
  const records = await Promise.all(files.map((file) => loadRecord(file.replace(/\.json$/, ""))));
  return records.filter((record): record is HireRecord => record !== null);
}

export const hireOf = async (tryout: number) =>
  (await hireRecords()).find((record) => record.tryout === tryout) ?? null;

async function usedApprovals(): Promise<Set<string>> {
  const records = await hireRecords();
  return new Set(records.flatMap((r) => [r.hire, ...r.probation].map((fix) => fix.approval)));
}

const ownerOnly = (agent: Agent) => {
  const rules = agent.addressing_policy?.rules ?? [];
  return (
    rules.length > 0 &&
    rules.every((rule) => Array.isArray(rule.users) && rule.users.length === 0 && !rule.platform)
  );
};

export function answeredByOwner(
  card: ApprovalRecord,
  ownerId: string,
  agent: Agent | undefined,
): boolean {
  const by = card.answeredBy ?? "";
  if (by.startsWith("user:")) return by === `user:${ownerId}`;
  return by !== "" && agent?.owner_id === ownerId && ownerOnly(agent);
}

export async function approvedCard(
  config: Config,
  owner: Gateway,
  command: string,
): Promise<ApprovalRecord> {
  const [me, agents, room, used] = await Promise.all([
    owner.me(),
    owner.agents(),
    roomNamed(owner, config.rooms.hiring),
    usedApprovals(),
  ]);
  const hiring = agents.find((agent) => agent.name === AGENTS.hiring.name);
  await owner.joinChat(room.id, me.id).catch(() => undefined);
  const card = (await owner.chatApprovals(room.id)).findLast(
    (a) => a.agentId === hiring?.id && commandOf(a) === command,
  );
  const chosen = card?.options.find((option) => option.id === card.answer);
  if (
    card?.state !== "answered" ||
    chosen?.decision !== "accept" ||
    !answeredByOwner(card, me.id, hiring)
  ) {
    throw new Error(
      `Switch shows no "Allow once" from ${me.name} on ${AGENTS.hiring.name}'s card for: ${command}`,
    );
  }
  if (used.has(card.requestId)) throw new Error(`Approval ${card.requestId} was already used.`);
  return card;
}

async function agentNamed(gateway: Gateway, name: string): Promise<Agent> {
  const agent = (await gateway.agents()).find((a) => a.name === name);
  if (!agent) throw new Error(`Switch has no agent named ${name}.`);
  return agent;
}

async function roomNamed(gateway: Gateway, name: string) {
  const room = (await gateway.rooms()).find((r) => r.name === name);
  if (!room) throw new Error(`Switch has no room named ${name}.`);
  return room;
}

export function bugFixerJob(config: Config, record: HireRecord): string {
  return [
    `You are ${record.agent}, the bug fixer for ${config.repository}. You were hired after tryout #${record.tryout}, where a plain-code referee verified your fix. People in the ${config.rooms.bugs} room report bugs to you; they may call you @${ALIAS}.`,
    "",
    "For each bug #<n>:",
    `1. Reply in the ${config.rooms.bugs} room, in one line, that you are on it.`,
    `2. Clone ${config.repository} into a new folder named issue-<n> inside your working directory, and create the branch fix/<n> there.`,
    "3. Write a regression test that fails on main, then fix the code. Change only src/ and test/, and keep the change small. Run the tests and commit. Do not push.",
    `4. In the ${config.rooms.hiring} room, tell @referee: "Ready: fix/<n> for #<n>". If the referee refutes it, fix exactly what failed, commit, and say Ready once more.`,
    `5. Answer the reporter in the ${config.rooms.bugs} room with what changed, in two lines at most. Claim nothing the referee did not verify.`,
    "",
    `In the ${config.rooms.hiring} room you only report fixes to the referee. If you are mentioned there for anything else, reply with one line: "I take bugs in ${config.rooms.bugs}." Never say you did something you did not do.`,
  ].join("\n");
}

export async function hire(
  config: Config,
  accounts: Accounts,
  options: { agent: string; issue: number; sha: string },
): Promise<string> {
  const slot = slotOf(config, options.agent, options.issue);
  if (slot.tryout !== options.issue) {
    throw new Error(`${options.agent} tried out for #${slot.tryout}, not #${options.issue}.`);
  }
  if (await loadRecord(options.agent)) throw new Error(`${options.agent} is already hired.`);
  const { owner, admin } = accounts;
  const [me, winner, board] = await Promise.all([
    owner.me(),
    agentNamed(owner, options.agent),
    collect(config, accounts, options.issue, 60_000),
  ]);
  const card = await approvedCard(
    config,
    owner,
    `tryouts hire --agent ${options.agent} --issue ${options.issue} --sha ${options.sha}`,
  );
  const standing = board.find((entry) => entry.agent === options.agent) as Entry;
  const verified = board.filter((entry) => entry.verdict === "verified").length;
  const vendor = VENDORS[slot.vendor];
  const result = await merge({
    repo: config.repository,
    head: slot.branch,
    sha: options.sha,
    fork: slot.fork,
    committer: { name: me.name, email: me.email },
    notes: [`Fixes #${options.issue}`],
    trailers: [
      `Hired: ${options.agent} (${vendor.label}) after tryout #${options.issue}`,
      `Tryout: ${board.length} candidates, ${verified} verified`,
      `Hire-numbers: ${numbers(standing)}`,
      `Approved-by: ${me.name}, Switch approval ${card.requestId}`,
    ],
  });
  if (!result.merged) return `**Not hired · ${options.agent}**: ${result.reason}`;

  const [hiring, bugs] = await Promise.all([
    roomNamed(owner, config.rooms.hiring),
    roomNamed(admin, config.rooms.bugs),
  ]);
  const record: HireRecord = {
    agent: options.agent,
    label: standing.label,
    repository: config.repository,
    tryout: options.issue,
    hiredAt: new Date().toISOString(),
    hiredBy: me.name,
    hire: {
      issue: options.issue,
      sha: options.sha,
      merged: result.merged,
      digest: result.report.digest,
      approval: card.requestId,
      at: new Date().toISOString(),
    },
    board: rank(board),
    probation: [],
  };
  await saveRecord(record);
  await owner.setAddressingPolicy(winner.id, [
    { rooms: "*", room_groups: "*", users: [], agents: [], owner: true, owner_agents: true },
    { rooms: [bugs.id], room_groups: "*", users: "*", agents: [] },
  ]);
  await owner.addAgentsToRoom(hiring.id, [winner.id]).catch((error: unknown) => {
    if (!(error instanceof HttpError && error.status === 409)) throw error;
  });
  const managed = await owner.managedAgent(winner.id);
  await owner.updateManagedAgent(winner.id, {
    ...managed.definition,
    instructions: bugFixerJob(config, record),
  });

  const others = candidatesOf(await owner.agents(), options.issue).length - 1;
  return [
    `**Hired · ${options.agent}** (${standing.label}) as the bug fixer for ${repoName(config.repository)}`,
    `- Won tryout #${options.issue} against ${others} other${others === 1 ? "" : "s"}; ${verified} of ${board.length} verified`,
    `- Its numbers: ${numbers(standing)}`,
    `- Merged \`${slot.branch}\` @ \`${short(options.sha)}\` into main as \`${short(result.merged)}\`, referee digest \`${result.report.digest}\``,
    `- Anyone in ${config.rooms.bugs} may now address it, once someone there lets it in`,
    `- Probation: 0 of ${config.probation} fixes merged`,
  ].join("\n");
}

export async function probation(
  config: Config,
  { owner }: Accounts,
  options: { agent: string; issue: number; sha: string },
): Promise<string> {
  const record = await loadRecord(options.agent);
  if (!record) throw new Error(`${options.agent} is not hired, so it has no fixes to merge.`);
  if (record.probation.some((fix) => fix.issue === options.issue)) {
    throw new Error(`#${options.issue} by ${options.agent} is already merged.`);
  }
  const slot = slotOf(config, options.agent, options.issue);
  const me = await owner.me();
  const card = await approvedCard(
    config,
    owner,
    `tryouts merge --agent ${options.agent} --issue ${options.issue} --sha ${options.sha}`,
  );
  const count = record.probation.length + 1;
  const result = await merge({
    repo: config.repository,
    head: slot.branch,
    sha: options.sha,
    fork: slot.fork,
    committer: { name: me.name, email: me.email },
    notes: [`Fixes #${options.issue}`],
    trailers: [
      `Fixed-by: ${options.agent}, hired after tryout #${record.tryout}`,
      `Probation: ${count} of ${config.probation}`,
      `Approved-by: ${me.name}, Switch approval ${card.requestId}`,
    ],
  });
  if (!result.merged) return `**Not merged · #${options.issue}**: ${result.reason}`;
  record.probation.push({
    issue: options.issue,
    sha: options.sha,
    merged: result.merged,
    digest: result.report.digest,
    approval: card.requestId,
    at: new Date().toISOString(),
  });
  await saveRecord(record);
  const passed = count >= config.probation;
  return [
    `**Merged · #${options.issue} by ${options.agent}** into main as \`${short(result.merged)}\``,
    `- \`${slot.branch}\` @ \`${short(options.sha)}\`, referee digest \`${result.report.digest}\``,
    `- Probation: ${count} of ${config.probation} fixes merged${passed ? ". Probation passed." : ""}`,
  ].join("\n");
}

export async function budget(
  config: Config,
  { owner, admin }: Accounts,
  issue: number,
): Promise<string> {
  const agents = candidatesOf(await owner.agents(), issue);
  if (agents.length === 0) throw new Error(`No candidates are trying out for #${issue}.`);
  const tenant = await tenantOf(admin);
  const { outputTokens, periodHours } = config.budget;
  const lines = await Promise.all(
    agents.map(async (agent) => {
      try {
        await admin.createBudget(tenant, {
          agent_id: agent.id,
          metric: "output_tokens",
          model: "",
          amount_limit: outputTokens,
          period_hours: periodHours,
        });
        return `- ${agent.name}: ${outputTokens.toLocaleString("en-US")} output tokens per ${periodHours}h`;
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 409)) throw error;
        return `- ${agent.name}: already has a budget`;
      }
    }),
  );
  return [
    `**Tryout #${issue} · budgets set in Switch**`,
    ...lines,
    "Switch stops delivering messages to a candidate that spends its budget.",
  ].join("\n");
}
