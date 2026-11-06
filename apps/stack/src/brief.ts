import { parseCard } from "@tryouts/referee";

const SCOREBOARD = /^\*\*Tryout #(\d+) · scoreboard\*\*/;
const BUDGETS = /^\*\*Tryout #(\d+) · budgets set in Switch\*\*/;
const LANE = /^\d+\. \*\*([a-z0-9-]+)\*\* · .*?· (✅ VERIFIED|❌ REFUTED|⏳ no branch yet)/gm;
const SUGGESTED = /Suggested hire: \*\*([a-z0-9-]+)\*\*/;
const BUDGET_LINE = /^- ([a-z0-9-]+): ([\d,]+ output tokens per \d+h)/gm;

const plain = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/\s*\n\s*/g, " ")
    .trim();

const clip = (text: string, max = 280) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function brief(text: string): string {
  const card = parseCard(text);
  if (card) {
    const passed = card.checks.filter((check) => check.passed).length;
    const before = plain(text.slice(0, text.indexOf("**Referee ·")));
    const verdict = `${card.verdict.toUpperCase()} \`${card.head.ref}\` · ${passed} of ${card.checks.length} checks · \`${card.digest.slice(0, 19)}…\``;
    return before ? `${before} ${verdict}` : verdict;
  }
  const board = SCOREBOARD.exec(text);
  if (board) {
    const lanes = [...text.matchAll(LANE)].map(
      ([, agent, status]) => `${agent} ${status?.replace(/^\S+ /, "")}`,
    );
    const pick = SUGGESTED.exec(text)?.[1];
    return `Scoreboard for #${board[1]}: ${lanes.join(", ")}.${pick ? ` Suggested hire: ${pick}.` : ""}`;
  }
  const budgets = BUDGETS.exec(text);
  if (budgets) {
    const lines = [...text.matchAll(BUDGET_LINE)];
    const agents = lines.map(([, agent]) => agent).join(", ");
    return `Budgets set in Switch for #${budgets[1]}: ${agents}, ${lines[0]?.[2] ?? "per agent"} each.`;
  }
  if (/^\*\*(Hired|Merged|Not hired|Not merged) ·/.test(text))
    return clip(plain(text.split("\n")[0] ?? ""));
  return clip(plain(text));
}
