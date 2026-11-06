import { AGENTS, ROOMS, VENDORS } from "@tryouts/kit";
import type { App, Candidate, TryoutRecord } from "@tryouts/kit/record";
import type { CheckId } from "@tryouts/referee";
import { list, ms, plural, sha7 } from "./format";

export const CHECKS: { id: CheckId; label: string }[] = [
  { id: "up-to-date", label: "Built on the latest main" },
  { id: "has-regression-test", label: "Adds a test for the bug" },
  { id: "in-scope", label: "Changes only what the bug needs" },
  { id: "fix-passes", label: "All tests pass with the fix" },
  { id: "test-catches-bug", label: "The new test fails without the fix" },
];

export const APPS: Record<App, string> = {
  slack: "Slack",
  discord: "Discord",
  mattermost: "Mattermost",
};

export type Result = "verified" | "failed" | "checking" | "working" | "over-budget";

export interface Standing {
  candidate: Candidate;
  rank: number;
  result: Result;
  checks: (boolean | null)[];
  passed: number;
}

const ORDER: Record<Result, number> = {
  verified: 0,
  failed: 1,
  checking: 2,
  working: 3,
  "over-budget": 4,
};

function resultOf(c: Candidate): Result {
  if (c.report) return c.report.verdict === "verified" ? "verified" : "failed";
  if (c.budget?.exhausted) return "over-budget";
  return c.readyAt ? "checking" : "working";
}

function compare(a: Standing, b: Standing): number {
  const order = ORDER[a.result] - ORDER[b.result];
  if (order !== 0) return order;
  if (a.candidate.report && b.candidate.report) {
    const cost = a.candidate.cost - b.candidate.cost;
    if (cost !== 0) return cost;
    const time =
      (a.candidate.seconds ?? Number.MAX_SAFE_INTEGER) -
      (b.candidate.seconds ?? Number.MAX_SAFE_INTEGER);
    if (time !== 0) return time;
  }
  return a.candidate.bib - b.candidate.bib;
}

export function standings(record: TryoutRecord): Standing[] {
  return record.candidates
    .map((candidate) => {
      const checks = CHECKS.map(
        ({ id }) => candidate.report?.checks.find((check) => check.id === id)?.passed ?? null,
      );
      return {
        candidate,
        rank: 0,
        result: resultOf(candidate),
        checks,
        passed: checks.filter(Boolean).length,
      };
    })
    .sort(compare)
    .map((standing, i) => ({ ...standing, rank: i + 1 }));
}

export const firstFailed = (s: Standing) => CHECKS[s.checks.indexOf(false)] ?? null;

export const vendorOf = (c: Candidate) => VENDORS[c.vendor]?.label ?? c.label;

export const ownerOf = (record: TryoutRecord) =>
  record.hire?.approval.answeredBy ?? record.posted.by;

export const appOf = (record: TryoutRecord, room: string): App | null =>
  record.rooms.find((r) => r.name === room)?.app ?? null;

export const appName = (record: TryoutRecord, room: string) => {
  const app = appOf(record, room);
  return app ? APPS[app] : "Switch";
};

const isLive = (record: TryoutRecord) => record.source === "live" && !record.endedAt;

export const hiredOf = (record: TryoutRecord) =>
  record.candidates.find((c) => c.agent === record.hire?.agent) ?? null;

export function endOf(record: TryoutRecord): string {
  if (record.endedAt) return record.endedAt;
  const times = [
    record.startedAt,
    ...record.feed.map((item) => item.at),
    ...record.probation.fixes.map((fix) => fix.at),
  ];
  return times.reduce((a, b) => (ms(b) > ms(a) ? b : a));
}

export const secondsOf = (record: TryoutRecord) =>
  (ms(endOf(record)) - ms(record.posted.at)) / 1000;

export type Tone = "green" | "amber" | "red" | "gray" | "blue";

export function statusOf(record: TryoutRecord): { label: string; tone: Tone; live: boolean } {
  if (record.hire) return { label: "Hired", tone: "green", live: false };
  if (isLive(record)) return { label: "In progress", tone: "amber", live: true };
  return { label: "No hire", tone: "gray", live: false };
}

function checkedAt(record: TryoutRecord, c: Candidate): number | null {
  if (!c.report || !c.readyAt) return null;
  const ready = ms(c.readyAt);
  const verdict = record.feed.find(
    (item) =>
      item.kind === "referee" &&
      item.room === c.room &&
      ms(item.at) >= ready &&
      /\b(VERIFIED|REFUTED)\b/.test(item.text),
  );
  return verdict ? ms(verdict.at) : ready + c.report.durationMs;
}

export type StepKind =
  | "posted"
  | "created"
  | "budgets"
  | "checked"
  | "ranked"
  | "approved"
  | "merged"
  | "refused"
  | "admitted"
  | "deleted"
  | "probation";

export interface Step {
  key: string;
  kind: StepKind;
  at: string;
  title: string;
  text: string;
  quote?: string;
  switch?: string;
  issue?: number;
  sha?: string;
}

const iso = (t: number) => new Date(t).toISOString();

export function stepsOf(record: TryoutRecord): Step[] {
  const owner = ownerOf(record);
  const hire = record.hire;
  const hired = hire?.agent ?? "the hire";
  const bugs = record.admitted?.room ?? ROOMS.bugs;
  const steps: Step[] = [
    {
      key: "posted",
      kind: "posted",
      at: record.posted.at,
      title: "Job posted",
      text: `${record.posted.by} asked the ${AGENTS.hiring.displayName.toLowerCase()} in #${record.posted.room} for a bug fixer.`,
      quote: record.posted.text,
    },
  ];

  const created = record.candidates.map((c) => ms(c.createdAt));
  const first = record.candidates[0];
  if (first) {
    steps.push({
      key: "created",
      kind: "created",
      at: iso(Math.max(...created)),
      title: "Candidates created",
      text: `${list(record.candidates.map((c) => c.agent))} each got the same bug and a private room.`,
      switch: `The ${AGENTS.hiring.displayName.toLowerCase()} ran a Switch template that created ${plural(record.candidates.length, "agent")} on ${first.machine}.`,
    });
  }

  const budgets = record.feed.find(
    (item) => item.kind === "referee" && /budgets? set/i.test(item.text),
  );
  const limit = record.candidates.find((c) => c.budget)?.budget?.limit;
  if (budgets && limit) {
    steps.push({
      key: "budgets",
      kind: "budgets",
      at: budgets.at,
      title: "Budgets set",
      text: `Each candidate can use up to ${limit.toLocaleString("en-US")} output tokens.`,
      switch: "Switch counts every agent's tokens and stops any that go over.",
    });
  }

  const judged = standings(record).filter((s) => s.candidate.report);
  const checked = judged.flatMap((s) => checkedAt(record, s.candidate) ?? []);
  if (judged.length > 0 && checked.length > 0) {
    const verified = judged.filter((s) => s.result === "verified").length;
    const failed = judged.find((s) => s.result === "failed");
    const reason = failed ? firstFailed(failed) : null;
    steps.push({
      key: "checked",
      kind: "checked",
      at: iso(Math.max(...checked)),
      title: "Fixes checked",
      text: `The referee ran the same 5 checks on every fix. ${verified} of ${judged.length} passed.${failed && reason ? ` ${failed.candidate.agent} failed: “${reason.label}”.` : ""}`,
    });
  }

  const board = record.feed.find(
    (item) => item.kind === "referee" && /^scoreboard/i.test(item.text),
  );
  if (board) {
    steps.push({
      key: "ranked",
      kind: "ranked",
      at: board.at,
      title: "Scoreboard posted",
      text: `${record.rule}${hire ? ` Top pick: ${hire.agent}.` : ""}`,
      switch: "Token counts come from Switch, measured the same way for every tool.",
    });
  }

  if (hire?.approval.answeredAt) {
    steps.push({
      key: "approved",
      kind: "approved",
      at: hire.approval.answeredAt,
      title: "Hire approved",
      text: `${hire.approval.answeredBy ?? owner} pressed “${hire.approval.answer}” in ${appName(record, hire.approval.room)}.`,
      switch: `Switch turned the hire into an approval button that only the agent's owner, ${owner}, can press.`,
    });
  }

  if (hire) {
    steps.push({
      key: "merged",
      kind: "merged",
      at: hire.at,
      title: "Fix merged",
      text: `${hire.agent}'s fix merged into main as ${sha7(hire.merged)}.`,
      issue: hire.issue,
      sha: hire.merged,
    });
  }

  if (record.refusal) {
    steps.push({
      key: "refused",
      kind: "refused",
      at: record.refusal.at,
      title: "Switch said no",
      text: `The ${AGENTS.hiring.displayName.toLowerCase()} tried to add ${hired} to #${bugs}. Switch refused, because ${owner} doesn't own that room.`,
      switch: "An agent can't join a room its owner doesn't own.",
    });
  }

  if (record.admitted) {
    steps.push({
      key: "admitted",
      kind: "admitted",
      at: record.admitted.at,
      title: `Let in by ${record.admitted.by}`,
      text: `${record.admitted.by}, who runs #${bugs} on ${appName(record, bugs)}, let ${hired} in and named it @${record.role}.`,
      switch: "A person in the room has to let the agent in.",
    });
  }

  const last = record.deletions.at(-1);
  if (last) {
    steps.push({
      key: "deleted",
      kind: "deleted",
      at: last.at,
      title: "Other candidates deleted",
      text: `${last.confirmedBy} confirmed deleting ${list(record.deletions.map((d) => d.agent))}.`,
      switch: `The ${AGENTS.hiring.displayName.toLowerCase()} can only ask. The owner or an admin has to confirm.`,
    });
  }

  record.probation.fixes.forEach((fix, i) => {
    steps.push({
      key: `probation-${fix.issue}`,
      kind: "probation",
      at: fix.at,
      title: i === 0 ? "First real job merged" : `Job ${i + 1} merged`,
      text: `${fix.reportedBy} reported issue #${fix.issue} in #${fix.room}. ${fix.agent} fixed it, the referee checked it, and it merged as ${sha7(fix.merged)}. Probation: ${Math.min(i + 1, record.probation.of)} of ${record.probation.of}.`,
      issue: fix.issue,
      sha: fix.merged,
    });
  });

  return steps.sort((a, b) => ms(a.at) - ms(b.at));
}
