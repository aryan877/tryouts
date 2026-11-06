import { AGENTS, VENDORS } from "@tryouts/kit";
import type { App, Candidate, FeedItem, Merge, Room, TryoutRecord } from "@tryouts/kit/record";
import type { CheckId, Verdict } from "@tryouts/referee";
import { clock, ms, tokens } from "./format";

export type LaneStatus =
  | "drawn"
  | "working"
  | "ready"
  | "checking"
  | "verified"
  | "refuted"
  | "over-budget"
  | "recommended"
  | "hired"
  | "dismissing"
  | "dismissed";

export type LightState = "off" | "checking" | "pass" | "fail" | "start";

export type Phase = "job" | "create" | "race" | "referee" | "pick" | "hired" | "probation";

export const PHASES: { id: Exclude<Phase, "probation">; label: string }[] = [
  { id: "job", label: "Job" },
  { id: "create", label: "Create" },
  { id: "race", label: "Race" },
  { id: "referee", label: "Referee" },
  { id: "pick", label: "Owner's pick" },
  { id: "hired", label: "Hired" },
];

export const CHECKS: { id: CheckId; label: string; title: string; short: string; long: string }[] =
  [
    {
      id: "up-to-date",
      label: "Base",
      title: "Based on the latest base",
      short: "Not on the latest base",
      long: "Not on the latest base",
    },
    {
      id: "has-regression-test",
      label: "Test",
      title: "Has a regression test",
      short: "No regression test",
      long: "No regression test",
    },
    {
      id: "in-scope",
      label: "Scope",
      title: "Stays in scope",
      short: "Changed files outside the bug",
      long: "Changed files outside the bug",
    },
    {
      id: "fix-passes",
      label: "Pass",
      title: "Fix passes",
      short: "Tests fail with the fix",
      long: "Tests fail with the fix",
    },
    {
      id: "test-catches-bug",
      label: "Catch",
      title: "Test catches the bug",
      short: "Test doesn't catch the bug",
      long: "Test passes without the fix, so it doesn't catch the bug",
    },
  ];

export type CheckInfo = (typeof CHECKS)[number];

export const checkOf = (id: CheckId) => CHECKS.find((check) => check.id === id) as CheckInfo;

export interface Lane {
  candidate: Candidate;
  vendor: string;
  rank: number;
  status: LaneStatus;
  verdict: Verdict | null;
  lights: LightState[];
  failed: CheckId | null;
  seconds: number | null;
  perFix: number | null;
  spent: number | null;
  budget: Candidate["budget"];
  best: { time: boolean; cost: boolean };
}

export interface Frame {
  at: number;
  phase: Phase;
  lanes: Lane[];
  verified: number;
  feed: FeedItem[];
  approval: "hidden" | "open" | "answered";
  hired: string | null;
  probation: number;
}

interface Marks {
  created: number;
  ready: number | null;
  checking: number | null;
  verdict: number | null;
  deleted: number | null;
}

const answeredAt = (hire: Merge) => ms(hire.approval.answeredAt ?? hire.at);

function marksOf(record: TryoutRecord, c: Candidate): Marks {
  const created = ms(c.createdAt);
  const deletion = record.deletions.find((d) => d.agent === c.agent);
  const deleted = deletion ? ms(deletion.at) : c.outcome === "deleted" ? endOf(record) : null;
  const ready = c.readyAt
    ? ms(c.readyAt)
    : c.report && c.seconds !== null
      ? created + c.seconds * 1000
      : null;
  if (ready === null || !c.report)
    return { created, ready, checking: null, verdict: null, deleted };
  const referee = record.feed
    .filter((item) => item.kind === "referee" && item.room === c.room && ms(item.at) >= ready)
    .map((item) => ms(item.at))
    .sort((a, b) => a - b);
  const checking = referee[0] ?? ready;
  const verdict = referee[1] ?? checking + c.report.durationMs;
  return { created, ready, checking, verdict, deleted };
}

export function endOf(record: TryoutRecord): number {
  if (record.endedAt) return ms(record.endedAt);
  const times = [
    ms(record.startedAt),
    ...record.feed.map((item) => ms(item.at)),
    ...record.candidates.flatMap((c) => [ms(c.createdAt), c.readyAt ? ms(c.readyAt) : 0]),
    ...record.deletions.map((d) => ms(d.at)),
    ...record.probation.fixes.map((fix) => ms(fix.at)),
    record.hire ? ms(record.hire.at) : 0,
  ];
  return Math.max(...times);
}

export function stopOf(record: TryoutRecord): number | null {
  if (record.hire) return answeredAt(record.hire);
  return record.endedAt ? ms(record.endedAt) : null;
}

export const ownerOf = (record: TryoutRecord) =>
  record.hire?.approval.answeredBy ?? record.posted.by;

export const roomOf = (record: TryoutRecord, name: string): Room | undefined =>
  record.rooms.find((room) => room.name === name);

export const appOf = (record: TryoutRecord, name: string): App | null =>
  roomOf(record, name)?.app ?? null;

export const vendorOf = (c: Candidate) => VENDORS[c.vendor]?.label ?? c.label;

export function lightsOf(c: Candidate): LightState[] {
  if (!c.report) return CHECKS.map(() => "off");
  const report = c.report;
  return CHECKS.map(({ id }) => {
    const check = report.checks.find((item) => item.id === id);
    return check ? (check.passed ? "pass" : "fail") : "off";
  });
}

const STANDING: Record<Verdict | "pending", number> = { verified: 0, refuted: 1, pending: 2 };

function compare(a: Lane, b: Lane): number {
  const standing = STANDING[a.verdict ?? "pending"] - STANDING[b.verdict ?? "pending"];
  if (standing !== 0) return standing;
  if (a.verdict) {
    const cost = a.candidate.cost - b.candidate.cost;
    if (cost !== 0) return cost;
    const time = (a.seconds ?? Number.POSITIVE_INFINITY) - (b.seconds ?? Number.POSITIVE_INFINITY);
    if (time !== 0) return time;
  }
  return a.candidate.bib - b.candidate.bib;
}

export function frameAt(record: TryoutRecord, at: number): Frame {
  const end = endOf(record);
  const current = at >= end;
  const started = ms(record.startedAt);
  const hire = record.hire;
  const asked = hire ? ms(hire.approval.askedAt) <= at : false;
  const hired = hire && answeredAt(hire) <= at ? hire.agent : null;
  const marks = new Map(record.candidates.map((c) => [c.agent, marksOf(record, c)]));
  const raceEnd = Math.max(started, ...[...marks.values()].map((m) => m.ready ?? 0));

  const lanes = record.candidates
    .filter((c) => (marks.get(c.agent) as Marks).created <= at)
    .map((c): Lane => {
      const m = marks.get(c.agent) as Marks;
      const finished = m.ready !== null && m.ready <= at;
      const judged = m.verdict !== null && m.verdict <= at;
      const verdict = judged ? (c.report?.verdict ?? null) : null;
      const exhausted = !!c.budget?.exhausted && !c.report && (current || at >= raceEnd);
      const reported = current || finished || exhausted;
      const status: LaneStatus =
        hired === c.agent
          ? "hired"
          : hired
            ? m.deleted !== null && m.deleted <= at
              ? "dismissed"
              : "dismissing"
            : asked && hire?.agent === c.agent
              ? "recommended"
              : verdict
                ? verdict
                : m.checking !== null && m.checking <= at
                  ? "checking"
                  : finished
                    ? "ready"
                    : exhausted
                      ? "over-budget"
                      : at >= started
                        ? "working"
                        : "drawn";
      const lights: LightState[] = judged
        ? lightsOf(c)
        : status === "checking"
          ? CHECKS.map(() => "checking")
          : CHECKS.map(() => "off");
      const failed = judged
        ? (CHECKS.find(({ id }) => c.report?.checks.find((x) => x.id === id)?.passed === false)
            ?.id ?? null)
        : null;
      return {
        candidate: c,
        vendor: vendorOf(c),
        rank: 0,
        status,
        verdict,
        lights,
        failed,
        seconds: finished ? (c.seconds ?? ((m.ready as number) - m.created) / 1000) : null,
        perFix: verdict === "verified" ? c.cost : null,
        spent: reported ? c.cost : null,
        budget: reported ? c.budget : null,
        best: { time: false, cost: false },
      };
    })
    .sort(compare)
    .map((lane, i) => ({ ...lane, rank: i + 1 }));

  const verifiedLanes = lanes.filter((lane) => lane.verdict === "verified");
  if (verifiedLanes.length >= 2) {
    const fastest = Math.min(...verifiedLanes.map((lane) => lane.seconds ?? Infinity));
    const cheapest = Math.min(...verifiedLanes.map((lane) => lane.candidate.cost));
    const time = verifiedLanes.find((lane) => lane.seconds === fastest);
    const cost = verifiedLanes.find((lane) => lane.candidate.cost === cheapest);
    if (time) time.best.time = true;
    if (cost) cost.best.cost = true;
  }

  const probation = record.probation.fixes.filter((fix) => ms(fix.at) <= at).length;
  const outstanding = lanes.some((lane) => lane.seconds === null && lane.status !== "over-budget");
  const phase: Phase =
    probation > 0
      ? "probation"
      : hired
        ? "hired"
        : asked
          ? "pick"
          : lanes.length === 0
            ? "job"
            : at < started
              ? "create"
              : outstanding || lanes.length < record.candidates.length
                ? "race"
                : "referee";

  return {
    at,
    phase,
    lanes,
    verified: verifiedLanes.length,
    feed: record.feed.filter((item) => ms(item.at) <= at).reverse(),
    approval: !hire || !asked ? "hidden" : hired ? "answered" : "open",
    hired,
    probation,
  };
}

export const finalFrame = (record: TryoutRecord) => frameAt(record, endOf(record));

export function detailOf(lane: Lane, record: TryoutRecord): string {
  const c = lane.candidate;
  const verdictLine =
    lane.verdict === "verified"
      ? `5 of 5 · try ${c.attempts}`
      : lane.failed
        ? `Failed: ${checkOf(lane.failed).short.toLowerCase()}`
        : null;
  switch (lane.status) {
    case "drawn":
      return `Created by ${AGENTS.hiring.name} · ${clock(c.createdAt)}`;
    case "working":
      return "On the clock";
    case "ready":
      return c.report ? `Committed ${c.report.head.ref}` : "Said Ready";
    case "checking":
      return "Referee is running 5 checks";
    case "verified":
    case "refuted":
      return verdictLine ?? "";
    case "over-budget":
      return c.budget ? `Switch stopped it at ${tokens(c.budget.limit)}` : "Switch stopped it";
    case "recommended":
      return `Hiring's pick. Waiting for ${ownerOf(record)}`;
    case "hired":
      return `${record.role} · approved by ${ownerOf(record)}`;
    case "dismissing":
      return `Waiting for ${ownerOf(record)} to confirm`;
    case "dismissed":
      return verdictLine ?? "Thanks for trying out";
  }
}

export const CHIP: Record<LaneStatus, string> = {
  drawn: "Drawn",
  working: "Working",
  ready: "Ready",
  checking: "Checking",
  verified: "VERIFIED",
  refuted: "REFUTED",
  "over-budget": "OVER BUDGET",
  recommended: "Recommended",
  hired: "HIRED",
  dismissing: "Dismissing",
  dismissed: "Dismissed",
};

export function recommendationOf(record: TryoutRecord): FeedItem | null {
  if (!record.hire) return null;
  const asked = ms(record.hire.approval.askedAt);
  return (
    record.feed.findLast((item) => item.actor === AGENTS.hiring.name && ms(item.at) <= asked) ??
    null
  );
}
