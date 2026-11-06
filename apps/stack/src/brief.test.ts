import { expect, test } from "bun:test";
import { brief } from "./brief";

const SHA = "a".repeat(40);
const DIGEST = `sha256:${"b".repeat(64)}`;

test("shortens a referee card to its verdict, checks and digest", () => {
  const card = [
    "Checking opencode-12.",
    `**Referee · VERIFIED** \`tryout/opencode-12\` @ \`${SHA}\` against \`main\` @ \`bf6cbe1\``,
    "- ✅ **Based on the latest base** ok",
    "- ✅ **Has a regression test** test/chunk.test.ts",
    `Digest \`${DIGEST}\` · re-run it yourself: \`tryouts verify --repo x --head tryout/opencode-12 --base bf6cbe1\``,
  ].join("\n");
  expect(brief(card)).toBe(
    `Checking opencode-12. VERIFIED \`tryout/opencode-12\` · 2 of 2 checks · \`${DIGEST.slice(0, 19)}…\``,
  );
});

test("shortens the scoreboard to its order and pick", () => {
  const board = [
    "**Tryout #12 · scoreboard**",
    "1. **opencode2-12** · OpenCode qwen · ✅ VERIFIED · 41s · 543.7k in · 1.8k out · est. $0.017",
    "2. **opencode-12** · OpenCode deepseek · ❌ REFUTED: test catches the bug · 57s · 1k in · 1k out · est. $0.037",
    "Suggested hire: **opencode2-12**, verified at the lowest estimated cost.",
  ].join("\n");
  expect(brief(board)).toBe(
    "Scoreboard for #12: opencode2-12 VERIFIED, opencode-12 REFUTED. Suggested hire: opencode2-12.",
  );
});

test("names the budgets once", () => {
  const budgets =
    "**Tryout #12 · budgets set in Switch**\n- opencode-12: 60,000 output tokens per 24h\n- opencode2-12: 60,000 output tokens per 24h\nSwitch stops…";
  expect(brief(budgets)).toBe(
    "Budgets set in Switch for #12: opencode-12, opencode2-12, 60,000 output tokens per 24h each.",
  );
});
