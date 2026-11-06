import { describe, expect, test } from "bun:test";
import type { TryoutRecord } from "@tryouts/kit/record";
import { FIXTURE } from "./fixture";
import { ms } from "./format";
import { firstFailed, standings, statusOf, stepsOf } from "./run";

const ranked = (record: TryoutRecord) =>
  standings(record).map((s) => [s.rank, s.candidate.agent, s.result]);

describe("standings", () => {
  test("verified first, then the cheapest verified fix, then the failures", () => {
    expect(ranked(FIXTURE)).toEqual([
      [1, "codex-1", "verified"],
      [2, "claude-1", "verified"],
      [3, "opencode-1", "failed"],
    ]);
  });

  test("a failed fix names the check that caught it", () => {
    const failed = standings(FIXTURE).find((s) => s.result === "failed");
    expect(failed?.passed).toBe(4);
    expect(firstFailed(failed as NonNullable<typeof failed>)?.id).toBe("test-catches-bug");
  });

  test("candidates without a report are still working, checking or over budget", () => {
    const [a, b, c] = FIXTURE.candidates as [
      TryoutRecord["candidates"][number],
      TryoutRecord["candidates"][number],
      TryoutRecord["candidates"][number],
    ];
    const live: TryoutRecord = {
      ...FIXTURE,
      source: "live",
      endedAt: null,
      hire: null,
      candidates: [
        { ...a, report: null, readyAt: null },
        { ...b, report: null },
        {
          ...c,
          report: null,
          readyAt: null,
          budget: { limit: 60_000, spent: 60_000, exhausted: true },
        },
      ],
    };
    expect(standings(live).map((s) => s.result)).toEqual(["checking", "working", "over-budget"]);
    expect(standings(live).every((s) => s.checks.every((check) => check === null))).toBe(true);
    expect(statusOf(live)).toEqual({ label: "In progress", tone: "amber", live: true });
  });
});

describe("stepsOf", () => {
  test("the timeline runs from the job post to the first probation fix, in order", () => {
    const steps = stepsOf(FIXTURE);
    expect(steps.map((step) => step.kind)).toEqual([
      "posted",
      "created",
      "budgets",
      "checked",
      "ranked",
      "approved",
      "merged",
      "refused",
      "deleted",
      "admitted",
      "probation",
    ]);
    const times = steps.map((step) => ms(step.at));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  test("each step says what happened in plain words, from the record", () => {
    const text = Object.fromEntries(stepsOf(FIXTURE).map((step) => [step.kind, step.text]));
    expect(text.checked).toBe(
      "The referee ran the same 5 checks on every fix. 2 of 3 passed. opencode-1 failed: “The new test fails without the fix”.",
    );
    expect(text.approved).toBe("Arjun pressed “Allow once” in Slack.");
    expect(text.admitted).toContain("Riya, who runs #bugs on Discord, let codex-1 in");
    expect(text.deleted).toBe("Arjun confirmed deleting claude-1 and opencode-1.");
    expect(text.probation).toContain("Probation: 1 of 3.");
  });

  test("a run with no hire stops at the scoreboard", () => {
    const steps = stepsOf({
      ...FIXTURE,
      hire: null,
      refusal: null,
      admitted: null,
      deletions: [],
      probation: { of: 3, fixes: [] },
    });
    expect(steps.at(-1)?.kind).toBe("ranked");
    expect(steps.some((step) => step.switch?.includes("undefined"))).toBe(false);
  });
});
