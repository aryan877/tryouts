import { describe, expect, test } from "bun:test";
import type { UsageTotal } from "@tryouts/switch";
import { duration, type Entry, rank, renderBoard, tally } from "./board";

const zero = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };

const entry = (agent: string, overrides: Partial<Entry>): Entry => ({
  agent,
  vendor: "opencode",
  model: null,
  createdAt: "2026-11-06T10:00:00Z",
  label: "OpenCode",
  verdict: "verified",
  failed: [],
  sha: "a".repeat(40),
  digest: "sha256:x",
  seconds: 300,
  tally: zero,
  counted: true,
  budget: null,
  ...overrides,
});

const row = (metric: UsageTotal["metric"], amount: number, model = ""): UsageTotal => ({
  metric,
  amount,
  model,
  client_id: "a1",
  client_name: "codex-12",
  client_type: "agent",
});

describe("tally", () => {
  test("prices each token kind per model and skips turns and messages", () => {
    const prices = {
      cheap: { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 0 },
      dear: { input: 10, output: 20, cacheRead: 5, cacheWrite: 0 },
    };
    const total = tally(
      [
        row("input_tokens", 1_000_000, "cheap"),
        row("output_tokens", 500_000, "dear"),
        row("cache_read_tokens", 2_000_000, "cheap"),
        row("turns", 7),
      ],
      (model) => prices[model as keyof typeof prices] ?? prices.cheap,
    );
    expect(total).toEqual({
      input: 1_000_000,
      output: 500_000,
      cacheRead: 2_000_000,
      cacheWrite: 0,
      cost: 12,
    });
  });
});

describe("rank", () => {
  test("puts verified first, then the cheaper, then the faster", () => {
    const ranked = rank([
      entry("pending-1", { verdict: null, sha: null, seconds: null }),
      entry("refuted-1", { verdict: "refuted", tally: zero }),
      entry("slow", { seconds: 900, tally: { ...zero, cost: 0.1 } }),
      entry("dear", { seconds: 60, tally: { ...zero, cost: 0.5 } }),
      entry("fast", { seconds: 120, tally: { ...zero, cost: 0.1 } }),
    ]);
    expect(ranked.map((e) => e.agent)).toEqual(["fast", "slow", "dear", "refuted-1", "pending-1"]);
  });
});

describe("renderBoard", () => {
  test("suggests the top verified candidate and names what failed", () => {
    const text = renderBoard(12, [
      entry("claude-12", { verdict: "refuted", failed: ["Test catches the bug"] }),
      entry("codex-12", { label: "Codex", tally: { ...zero, output: 8_100, cost: 0.2 } }),
    ]);
    expect(text).toContain("1. **codex-12** · Codex · ✅ VERIFIED · 5m 00s");
    expect(text).toContain("2. **claude-12** · OpenCode · ❌ REFUTED: test catches the bug");
    expect(text).toContain("Suggested hire: **codex-12**");
  });

  test("withholds a suggestion while a verified candidate's tokens are uncounted", () => {
    const text = renderBoard(1, [
      entry("opencode-1", { tally: { ...zero, cost: 0.03 } }),
      entry("codex-1", { counted: false }),
    ]);
    expect(text).toContain("1. **opencode-1**");
    expect(text).toContain(
      "2. **codex-1** · OpenCode · ✅ VERIFIED · 5m 00s · tokens not counted yet",
    );
    expect(text).toContain("No suggestion yet: Switch has not counted codex-1's tokens");
    expect(text).not.toContain("Suggested hire");
  });

  test("suggests nobody when nothing is verified", () => {
    const text = renderBoard(12, [entry("codex-12", { verdict: "refuted" })]);
    expect(text).toContain("there is no hire to suggest");
  });
});

test("duration reads like a clock", () => {
  expect([duration(42), duration(250), duration(3_725)]).toEqual(["42s", "4m 10s", "1h 02m"]);
});
