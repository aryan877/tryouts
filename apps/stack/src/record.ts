import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { history, slotOf } from "@tryouts/cli/bench";
import { collect, type Entry, rank, tenantOf } from "@tryouts/cli/board";
import { type Config, loadConfig, PRICES_AS_OF, STATE_DIR, signIn } from "@tryouts/cli/config";
import { type Fix, type HireRecord, loadRecord } from "@tryouts/cli/hire";
import { ISSUES, MACHINE, PEOPLE, type PersonKey, ROOMS } from "@tryouts/kit";
import type {
  App,
  Approval,
  Candidate,
  FeedItem,
  Merge,
  Room,
  TryoutRecord,
} from "@tryouts/kit/record";
import { git, type ProofReport } from "@tryouts/referee";
import { type ApprovalRecord, type ChatMessage, Gateway } from "@tryouts/switch";
import { brief } from "./brief";
import { chatPlan } from "./chat";
import { ROOT, SWITCH_URL } from "./config";
import { mirror } from "./repos";
import { step } from "./shell";
import { loadState } from "./state";

interface Transcript {
  room: Room;
  messages: ChatMessage[];
  approvals: ApprovalRecord[];
}

const RULE = "Verified first, then the lowest estimated cost per verified fix, then the fastest.";
const NOISE = /^(\*\*Queued|Starting a session)/;
const TRYOUT_ROOM = (issue: number) => new RegExp(`^tryout-${issue}-`);

async function read(gateway: Gateway, names: (name: string) => boolean): Promise<Transcript[]> {
  const me = await gateway.me();
  const bridges = new Map((await gateway.bridges()).map((b) => [b.bridge_id, b.bridge_type]));
  const rooms = (await gateway.rooms()).filter((room) => names(room.name));
  return Promise.all(
    rooms.map(async (summary) => {
      const detail = await gateway.room(summary.id);
      await gateway.joinChat(summary.id, me.id).catch(() => undefined);
      const [messages, approvals] = await Promise.all([
        gateway.chatMessages(summary.id),
        gateway.chatApprovals(summary.id),
      ]);
      return {
        room: {
          name: summary.name,
          app: (bridges.get(detail.bridge_id ?? "") ?? "mattermost") as App,
          owner: detail.owner_name ?? me.name,
          group: summary.name.startsWith("tryout-")
            ? `Tryout #${summary.name.split("-")[1]}`
            : null,
          url: summary.external_channel_url,
        },
        messages,
        approvals,
      };
    }),
  );
}

const kindOf = (message: ChatMessage): FeedItem["kind"] =>
  message.sender.kind === "human"
    ? "person"
    : message.sender.kind === "system"
      ? "switch"
      : message.sender.name === "referee"
        ? "referee"
        : "agent";

function approvalOf(
  transcript: Transcript,
  command: string,
  people: Map<string, string>,
): Approval | null {
  const record = transcript.approvals.find((a) =>
    `${a.title}\n${a.detail ?? ""}`.includes(command),
  );
  if (!record) return null;
  const answered = Date.parse(record.answeredAt ?? "") || Number.POSITIVE_INFINITY;
  const asked = transcript.messages.findLast(
    (m) => m.sender.agentId === record.agentId && Date.parse(m.sentAt) < answered,
  );
  return {
    command,
    options: record.options.map((option) => option.label),
    answer: record.options.find((option) => option.id === record.answer)?.label ?? record.answer,
    answeredBy: record.answeredBy
      ? (people.get(record.answeredBy.replace(/^user:/, "")) ?? record.answeredBy)
      : null,
    askedAt: asked?.sentAt ?? record.answeredAt ?? "",
    answeredAt: record.answeredAt,
    room: transcript.room.name,
  };
}

async function trailers(sha: string): Promise<string[]> {
  const text = await git(await mirror(), "log", "-1", "--format=%(trailers:only,unfold)", sha);
  return text.split("\n").filter(Boolean);
}

async function mergeOf(
  verb: "hire" | "merge",
  fix: Fix,
  agent: string,
  hiring: Transcript,
  people: Map<string, string>,
): Promise<Merge> {
  const command = `tryouts ${verb} --agent ${agent} --issue ${fix.issue} --sha ${fix.sha}`;
  const approval = approvalOf(hiring, command, people) ?? {
    command,
    options: [],
    answer: null,
    answeredBy: null,
    askedAt: fix.at,
    answeredAt: null,
    room: hiring.room.name,
  };
  const title = Object.values(ISSUES).find((issue) => issue.number === fix.issue)?.title ?? "";
  return { ...fix, title, agent, approval, trailers: await trailers(fix.merged) };
}

async function diffOf(report: ProofReport, fork: string) {
  const numstat = await git(fork, "diff", "--numstat", report.base.sha, report.head.sha).catch(
    () => null,
  );
  if (numstat === null) return null;
  return numstat
    .split("\n")
    .filter(Boolean)
    .reduce(
      (sum, line) => {
        const [added = "0", removed = "0"] = line.split("\t");
        return { added: sum.added + Number(added), removed: sum.removed + Number(removed) };
      },
      { added: 0, removed: 0 },
    );
}

async function reportOf(
  config: Config,
  agent: string,
  issue: number,
  digest: string | null,
): Promise<ProofReport | null> {
  const checks = await history(slotOf(config, agent, issue));
  return (checks.find((c) => c.report.digest === digest) ?? checks.at(-1))?.report ?? null;
}

export async function record(issue: number): Promise<TryoutRecord> {
  const config = await loadConfig();
  const { passwords } = await loadState();
  const accounts = await signIn(config);
  const arjun = accounts.owner;
  const riya = await Gateway.login(SWITCH_URL, PEOPLE.community.email, passwords.community);
  const ours = await read(arjun, (name) => name === ROOMS.hiring || TRYOUT_ROOM(issue).test(name));
  const [bugs] = await read(riya, (name) => name === ROOMS.bugs);
  const hiring = ours.find((t) => t.room.name === ROOMS.hiring);
  if (!hiring || !bugs) throw new Error(`#${ROOMS.hiring} or #${ROOMS.bugs} is missing in Switch.`);
  const transcripts = [...ours, bugs];
  const people = new Map((await accounts.admin.users()).map((user) => [user.id, user.name]));
  const handles = new Map<string, string>(
    (Object.entries(chatPlan()) as [PersonKey, { handle: string }][]).flatMap(([key, app]) => [
      [app.handle, PEOPLE[key].name],
      [PEOPLE[key].chat, PEOPLE[key].name],
    ]),
  );
  const nameOf = (m: ChatMessage | undefined) =>
    !m ? "" : m.sender.kind === "system" ? "Switch" : (handles.get(m.sender.name) ?? m.sender.name);

  const alive = new Set((await arjun.agents()).map((agent) => agent.name));
  const hires = await readdir(join(STATE_DIR, "hires")).catch(() => [] as string[]);
  const records = await Promise.all(hires.map((file) => loadRecord(file.replace(/\.json$/, ""))));
  const hire = records.find((r) => r?.tryout === issue) ?? null;
  const entries: Entry[] = hire ? hire.board : rank(await collect(config, accounts, issue));

  const byCreation = [...entries].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const candidates: Candidate[] = await Promise.all(
    byCreation.map(async (entry, index) => {
      const slot = slotOf(config, entry.agent, issue);
      const room = `tryout-${issue}-${slot.vendor}`;
      const said = (ours.find((t) => t.room.name === room)?.messages ?? []).filter(
        (m) => m.sender.name === entry.agent && m.body.includes("Ready:"),
      );
      const report = await reportOf(config, entry.agent, issue, entry.digest);
      return {
        agent: entry.agent,
        bib: index + 1,
        vendor: entry.vendor,
        label: entry.label,
        model: entry.model,
        machine: MACHINE,
        room,
        createdAt: new Date(entry.createdAt).toISOString(),
        readyAt: said[0]?.sentAt ?? null,
        attempts: Math.max(said.length, report ? 1 : 0),
        report,
        diff: report ? await diffOf(report, slot.fork) : null,
        seconds: entry.seconds,
        tokens: {
          input: entry.tally.input,
          output: entry.tally.output,
          cacheRead: entry.tally.cacheRead,
          cacheWrite: entry.tally.cacheWrite,
        },
        cost: entry.tally.cost,
        budget: entry.budget,
        outcome: hire?.agent === entry.agent ? "hired" : alive.has(entry.agent) ? null : "deleted",
      };
    }),
  );

  const feed: FeedItem[] = transcripts
    .flatMap((t) =>
      t.messages
        .filter((m) => m.body.trim() && !NOISE.test(m.body))
        .map((m) => ({
          at: m.sentAt,
          actor: nameOf(m),
          kind: kindOf(m),
          room: t.room.name,
          text: brief(m.body),
        })),
    )
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const posted = hiring.messages.find(
    (m) => m.sender.kind === "human" && m.body.includes(`#${issue}`) && m.body.includes("@hiring"),
  );
  const after = (at: string | undefined) => (m: ChatMessage) =>
    !at || Date.parse(m.sentAt) > Date.parse(at);
  const refusal = hire
    ? hiring.messages.find(
        (m) =>
          m.sender.name === "hiring" && after(hire.hiredAt)(m) && m.body.includes("!invite-agent"),
      )
    : undefined;
  const admits = bugs.messages.filter(
    (m) => m.sender.kind === "human" && /^!(invite-agent|set-alias) /.test(m.body.trim()),
  );
  const deleted = (agent: string, at: string) =>
    hiring.messages.some(
      (later) =>
        after(at)(later) &&
        later.sender.kind !== "human" &&
        later.body.includes(`(\`${agent}\`)`) &&
        /was deleted|^Deleted \*\*/.test(later.body),
    );
  const deletions = hiring.messages.flatMap((m) => {
    const agent = /^!delete-agent ([a-z0-9-]+) confirm$/.exec(m.body.trim())?.[1];
    return agent && deleted(agent, m.sentAt)
      ? [{ agent, confirmedBy: nameOf(m), at: m.sentAt }]
      : [];
  });
  const firstDeletions = deletions.filter(
    (d, i) => deletions.findIndex((e) => e.agent === d.agent) === i,
  );

  const startedAt = candidates[0]?.createdAt ?? posted?.sentAt ?? new Date().toISOString();
  const result: TryoutRecord = {
    version: 1,
    source: "recorded",
    issue,
    title: Object.values(ISSUES).find((i) => i.number === issue)?.title ?? "",
    repository: config.repository.startsWith(ROOT) ? "tinychunk" : config.repository,
    role: "bugfixer",
    posted: {
      by: posted ? nameOf(posted) : PEOPLE.lead.name,
      room: ROOMS.hiring,
      text: posted?.body ?? "",
      at: posted?.sentAt ?? startedAt,
    },
    startedAt,
    endedAt: hire ? (feed.at(-1)?.at ?? hire.hiredAt) : null,
    rule: RULE,
    candidates,
    rooms: transcripts.map((t) => t.room),
    feed,
    hire: hire ? await mergeOf("hire", hire.hire, hire.agent, hiring, people) : null,
    refusal: refusal ? { text: refusal.body, at: refusal.sentAt } : null,
    admitted: admits[0]
      ? {
          by: nameOf(admits[0]),
          room: ROOMS.bugs,
          commands: [...new Set(admits.map((m) => m.body.trim()))],
          at: admits[0].sentAt,
        }
      : null,
    deletions: firstDeletions,
    probation: {
      of: config.probation,
      fixes: hire
        ? await Promise.all(
            hire.probation.map(async (fix) => ({
              ...(await mergeOf("merge", fix, hire.agent, hiring, people)),
              reportedBy: nameOf(
                bugs.messages.find(
                  (m) => m.sender.kind === "human" && m.body.includes(`#${fix.issue}`),
                ),
              ),
              room: ROOMS.bugs,
            })),
          )
        : [],
    },
    prices: { asOf: PRICES_AS_OF, perMillion: config.prices },
  };
  await writeEvidence(result, transcripts, accounts.admin, config, hire);
  return result;
}

async function writeEvidence(
  result: TryoutRecord,
  transcripts: Transcript[],
  admin: Gateway,
  config: Config,
  hire: HireRecord | null,
): Promise<void> {
  const dir = join(ROOT, "evidence", `tryout-${result.issue}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(join(dir, "branches"), { recursive: true });
  step(`Writing the record and evidence for tryout #${result.issue}`);
  const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
  const tenant = await tenantOf(admin);
  await Promise.all([
    Bun.write(join(ROOT, "apps/web/records", `${result.issue}.json`), json(result)),
    Bun.write(join(dir, "record.json"), json(result)),
    Bun.write(join(dir, "transcripts.json"), json(transcripts)),
    Bun.write(
      join(dir, "usage.json"),
      json(
        await admin.usage(tenant, new Date(Date.parse(result.startedAt) - 3_600_000), new Date()),
      ),
    ),
    Bun.write(join(dir, "budgets.json"), json(await admin.budgets(tenant))),
    ...(hire ? [Bun.write(join(dir, "hire.json"), json(hire))] : []),
  ]);
  await git(await mirror(), "bundle", "create", join(dir, "origin.bundle"), "--all");
  const branches = [
    ...result.candidates.map((c) => ({
      agent: c.agent,
      issue: result.issue,
      digest: c.report?.digest ?? null,
    })),
    ...result.probation.fixes.map((fix) => ({
      agent: fix.agent,
      issue: fix.issue,
      digest: fix.digest,
    })),
  ];
  await mkdir(join(dir, "reports"), { recursive: true });
  for (const { agent, issue, digest } of branches) {
    const report = await reportOf(config, agent, issue, digest);
    if (!report) continue;
    const slot = slotOf(config, agent, issue);
    const name = `${agent}-${issue}`;
    await Bun.write(join(dir, "reports", `${name}.json`), json(report));
    await git(
      slot.fork,
      "bundle",
      "create",
      join(dir, "branches", `${name}.bundle`),
      `refs/heads/${slot.branch}`,
    );
  }
}
