import { describe, expect, test } from "bun:test";
import type { ProofReport } from "@tryouts/referee";
import type { Slot } from "./bench";
import { nextSteps } from "./next";

const slot = (agent: string, issue: number, tryout: number): Slot => ({
  agent,
  vendor: "codex",
  tryout,
  issue,
  branch: issue === tryout ? `tryout/${agent}` : `fix/${issue}`,
  fork: "/bench",
});
const report = (verdict: "verified" | "refuted") =>
  ({ verdict, head: { ref: "x", sha: "a".repeat(40) } }) as ProofReport;

describe("nextSteps", () => {
  test("the last card of a tryout asks for the scoreboard", () => {
    const text = nextSteps(slot("codex-1", 1, 1), report("verified"), []);
    expect(text).toContain("post exactly: codex-1: VERIFIED for #1.");
    expect(text).toContain("run exactly `tryouts board --issue 1`");
  });

  test("an earlier card waits for the others", () => {
    const text = nextSteps(slot("codex-1", 1, 1), report("refuted"), ["claude-1"]);
    expect(text).toContain("tell @codex-1 in this room which checks failed");
    expect(text).toContain("Still waiting for claude-1");
    expect(text).not.toContain("tryouts board");
  });

  test("a hire's first refuted fix stays in the room", () => {
    const text = nextSteps(slot("codex-1", 2, 1), report("refuted"), [], 1);
    expect(text).toContain("strike 1 of 3");
    expect(text).toContain("Post nothing in #hiring");
  });

  test("three refuted fixes end probation", () => {
    expect(nextSteps(slot("codex-1", 2, 1), report("refuted"), [], 3)).toBe(
      "Next: in #hiring, post exactly: @hiring codex-1 failed probation on #2: 3 fixes refuted.",
    );
  });

  test("a hire's verified fix wakes the hiring manager with the commit", () => {
    expect(nextSteps(slot("codex-1", 2, 1), report("verified"), [])).toBe(
      `Next: in #hiring, post exactly: @hiring codex-1: VERIFIED for #2, commit ${"a".repeat(40)}.`,
    );
  });
});
