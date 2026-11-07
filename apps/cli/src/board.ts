import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseCandidate, tryoutRoom, VENDORS, type Vendor } from "@tryouts/kit";
import { type Fix, type FixStat, type RivalReport, rivals, type Verdict } from "@tryouts/referee";
import {
  type Agent,
  administers,
  type Budget,
  type Gateway,
  type UsageTotal,
} from "@tryouts/switch";
import { commitTime, latest, type Slot, slotOf } from "./bench";
import { type Accounts, type Config, type Price, STATE_DIR } from "./config";

export interface Tally {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
}

export interface Entry {
  agent: string;
  vendor: Vendor;
  model: string | null;
  createdAt: string;
  label: string;
  verdict: Verdict | null;
  failed: string[];
  sha: string | null;
  digest: string | null;
  tests: string[];
  seconds: number | null;
  diff: { added: number; removed: number; files: string[] } | null;
  rivals: { passed: number; total: number; failed: string[] } | null;
  tally: Tally;
  counted: boolean;
  budget: { spent: number; limit: number; exhausted: boolean } | null;
}

const PRICED: Partial<Record<UsageTotal["metric"], keyof Price>> = {
  input_tokens: "input",
  output_tokens: "output",
  cache_read_tokens: "cacheRead",
  cache_write_tokens: "cacheWrite",
};

export function tally(rows: UsageTotal[], price: (model: string) => Price): Tally {
  const total: Tally = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  for (const row of rows) {
    const key = PRICED[row.metric];
    if (!key) continue;
    total[key] += row.amount;
    total.cost += (row.amount * price(row.model)[key]) / 1_000_000;
  }
  return total;
}

const STANDING: Record<Verdict | "pending", number> = { verified: 0, refuted: 1, pending: 2 };

export function rank(entries: Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) =>
      STANDING[a.verdict ?? "pending"] - STANDING[b.verdict ?? "pending"] ||
      (a.rivals?.failed.length ?? 0) - (b.rivals?.failed.length ?? 0) ||
      Number(b.counted) - Number(a.counted) ||
      a.tally.cost - b.tally.cost ||
      (a.seconds ?? Number.POSITIVE_INFINITY) - (b.seconds ?? Number.POSITIVE_INFINITY),
  );
}

export const uncounted = (entries: Entry[]) =>
  entries.filter((entry) => entry.verdict === "verified" && !entry.counted);

export const suggested = (ranked: Entry[]) =>
  ranked[0]?.verdict === "verified" && uncounted(ranked).length === 0 ? ranked[0] : null;

export function tokens(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

export function duration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3_600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3_600)}h ${String(Math.floor((s % 3_600) / 60)).padStart(2, "0")}m`;
}

export const dollars = (usd: number) =>
  usd < 0.001 ? "<$0.001" : `$${usd.toFixed(usd < 1 ? 3 : 2)}`;

export const tokensIn = (t: Tally) => t.input + t.cacheRead + t.cacheWrite;

export function numbers(entry: Entry): string {
  const parts = [
    entry.seconds === null ? null : duration(entry.seconds),
    ...(entry.counted
      ? [
          `${tokens(tokensIn(entry.tally))} in · ${tokens(entry.tally.output)} out`,
          `est. ${dollars(entry.tally.cost)}`,
        ]
      : ["tokens not counted yet"]),
  ];
  return parts.filter(Boolean).join(" · ");
}

function rivalTests(entry: Entry): string | null {
  if (!entry.rivals || entry.rivals.total === 0) return null;
  return entry.rivals.failed.length > 0
    ? `⚠️ fails ${entry.rivals.failed.join(", ")}'s tests`
    : `rival tests ${entry.rivals.passed}/${entry.rivals.total}`;
}

function line(entry: Entry, place: number): string {
  const status =
    entry.verdict === "verified"
      ? "✅ VERIFIED"
      : entry.verdict === "refuted"
        ? `❌ REFUTED: ${entry.failed.join(", ").toLowerCase()}`
        : "⏳ no branch yet";
  const spent = entry.budget?.exhausted ? " · 🛑 budget spent" : "";
  const facts = [
    status,
    rivalTests(entry),
    entry.diff ? `+${entry.diff.added} −${entry.diff.removed}` : null,
    numbers(entry),
  ];
  return `${place}. **${entry.agent}** · ${entry.label} · ${facts.filter(Boolean).join(" · ")}${spent}`;
}

export function renderBoard(issue: number, entries: Entry[]): string {
  const ranked = rank(entries);
  const pick = suggested(ranked);
  return [
    `**Tryout #${issue} · scoreboard**`,
    ...ranked.map((entry, i) => line(entry, i + 1)),
    pick
      ? `Suggested hire: **${pick.agent}**, ${pick.rivals?.failed.length ? "verified" : "verified and clean against its rivals' tests"}, at the lowest estimated cost.`
      : uncounted(ranked).length > 0
        ? `No suggestion yet: Switch has not counted ${uncounted(ranked)
            .map((e) => e.agent)
            .join(", ")}'s tokens, so costs can't be compared. Run the board again in a minute.`
        : `No candidate is verified yet, so there is no hire to suggest.`,
    "Rival tests run each fix against the other candidates' new tests. Tokens are Switch's usage counts, added when each turn ends. Dollars are list-price estimates, not bills. Time runs from the agent's creation to when it said Ready.",
  ].join("\n");
}

export const candidatesOf = (agents: Agent[], issue: number) =>
  agents.filter((agent) => parseCandidate(agent.name)?.issue === issue);

export async function tenantOf(gateway: Gateway): Promise<string> {
  const tenant = (await gateway.tenants()).find(administers);
  if (!tenant) throw new Error("The tryouts account must be a Switch workspace admin.");
  return tenant.id;
}

export async function collect(
  config: Config,
  { owner, admin }: Accounts,
  issue: number,
  settleMs = 0,
): Promise<Entry[]> {
  const agents = candidatesOf(await owner.agents(), issue);
  if (agents.length === 0) throw new Error(`No candidates are trying out for #${issue}.`);
  const tenant = await tenantOf(admin);
  const since = new Date(Math.min(...agents.map((agent) => Date.parse(agent.created_at))));
  const deadline = Date.now() + settleMs;
  for (;;) {
    const [usage, budgets] = await Promise.all([
      admin.usage(tenant, since, new Date(Date.now() + 60_000)),
      admin.budgets(tenant),
    ]);
    const entries = await Promise.all(
      agents.map((agent) => entryOf(config, owner, agent, issue, usage, budgets)),
    );
    if (uncounted(entries).length === 0 || Date.now() >= deadline) {
      return withRivals(config, issue, entries);
    }
    await Bun.sleep(5_000);
  }
}

export interface SavedRivals {
  fixes: Fix[];
  report: RivalReport;
}

const rivalsFile = (issue: number) => join(STATE_DIR, "rivals", `${issue}.json`);

export async function savedRivals(issue: number): Promise<SavedRivals | null> {
  const file = Bun.file(rivalsFile(issue));
  return (await file.exists()) ? ((await file.json()) as SavedRivals) : null;
}

export const fixStat = async (issue: number, agent: string): Promise<FixStat | null> =>
  (await savedRivals(issue))?.report.stats[agent] ?? null;

async function withRivals(config: Config, issue: number, entries: Entry[]): Promise<Entry[]> {
  const verified = entries.filter((entry) => entry.verdict === "verified" && entry.sha);
  if (verified.length === 0) return entries;
  const fixes = verified.map((entry) => {
    const slot = slotOf(config, entry.agent, issue);
    return {
      name: entry.agent,
      fork: slot.fork,
      head: slot.branch,
      sha: entry.sha as string,
      tests: entry.tests,
    };
  });
  const file = Bun.file(rivalsFile(issue));
  const saved = (await file.exists()) ? ((await file.json()) as SavedRivals) : null;
  const known = saved?.fixes.length
    ? fixes.every((fix) => saved.fixes.some((f) => f.name === fix.name && f.sha === fix.sha))
    : false;
  const report = known
    ? (saved as SavedRivals).report
    : await rivals({ repo: config.repository, fixes });
  if (!known) {
    await mkdir(join(STATE_DIR, "rivals"), { recursive: true });
    await Bun.write(rivalsFile(issue), `${JSON.stringify({ fixes, report }, null, 2)}\n`);
  }
  return entries.map((entry) => {
    const stat = report.stats[entry.agent];
    const duels = report.duels.filter((duel) => duel.fix === entry.agent);
    return {
      ...entry,
      diff: stat ? { added: stat.added, removed: stat.removed, files: stat.files } : null,
      rivals: stat
        ? {
            passed: duels.filter((duel) => duel.passed).length,
            total: duels.length,
            failed: duels.filter((duel) => !duel.passed).map((duel) => duel.tests),
          }
        : null,
    };
  });
}

async function saidReady(gateway: Gateway, slot: Slot): Promise<Date | null> {
  const room = (await gateway.rooms()).find((r) => r.name === tryoutRoom(slot.vendor, slot.tryout));
  if (!room) return null;
  const me = await gateway.me();
  await gateway.joinChat(room.id, me.id).catch(() => undefined);
  const messages = await gateway.chatMessages(room.id).catch(() => []);
  const said = messages.findLast((m) => m.sender.name === slot.agent && m.body.includes("Ready:"));
  return said ? new Date(said.sentAt) : null;
}

async function entryOf(
  config: Config,
  gateway: Gateway,
  agent: Agent,
  issue: number,
  usage: UsageTotal[],
  budgets: Budget[],
): Promise<Entry> {
  const slot = slotOf(config, agent.name, issue);
  const vendor = VENDORS[slot.vendor];
  const [checked, managed] = await Promise.all([
    latest(config, slot),
    gateway.managedAgent(agent.id).catch(() => null),
  ]);
  const model = managed?.definition.model ?? null;
  const sha = checked?.report.head.sha ?? null;
  const finished = sha ? ((await saidReady(gateway, slot)) ?? (await commitTime(slot, sha))) : null;
  const budget = budgets.find((b) => b.agent_id === agent.id && b.metric === "output_tokens");
  const price = (name: string) => config.prices[name] ?? (config.prices[vendor.provider] as Price);
  return {
    agent: agent.name,
    vendor: slot.vendor,
    model,
    createdAt: agent.created_at,
    label: model ? `${vendor.label} ${model.split("/").pop()}` : vendor.label,
    verdict: checked?.report.verdict ?? null,
    failed: checked?.report.checks.filter((c) => !c.passed).map((c) => c.title) ?? [],
    sha,
    digest: checked?.report.digest ?? null,
    tests: checked?.report.changed.tests ?? [],
    diff: null,
    rivals: null,
    seconds: finished ? (finished.getTime() - Date.parse(agent.created_at)) / 1000 : null,
    tally: tally(
      usage.filter((row) => row.client_name === agent.name),
      price,
    ),
    counted: usage.some(
      (row) => row.client_name === agent.name && row.metric === "output_tokens" && row.amount > 0,
    ),
    budget: budget
      ? { spent: budget.spent, limit: budget.amount_limit, exhausted: budget.exhausted }
      : null,
  };
}
