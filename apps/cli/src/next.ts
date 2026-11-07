import type { ProofReport } from "@tryouts/referee";
import type { Slot } from "./bench";

export const STRIKES = 3;

export function nextSteps(slot: Slot, report: ProofReport, waiting: string[], strikes = 0): string {
  const verdict = report.verdict.toUpperCase();
  if (slot.issue !== slot.tryout) {
    if (report.verdict === "verified") {
      return `Next: in #hiring, post exactly: @hiring ${slot.agent}: VERIFIED for #${slot.issue}, commit ${report.head.sha}.`;
    }
    return strikes >= STRIKES
      ? `Next: in #hiring, post exactly: @hiring ${slot.agent} failed probation on #${slot.issue}: ${strikes} fixes refuted.`
      : `Next: tell @${slot.agent} in this room which checks failed (strike ${strikes} of ${STRIKES} on #${slot.issue}). Post nothing in #hiring.`;
  }
  return [
    `Next: in #hiring, post exactly: ${slot.agent}: ${verdict} for #${slot.issue}.`,
    ...(report.verdict === "refuted"
      ? [`Then tell @${slot.agent} in this room which checks failed.`]
      : []),
    waiting.length > 0
      ? `Still waiting for ${waiting.join(", ")}, so do nothing else.`
      : `Every candidate has a card now, so then run exactly \`tryouts board --issue ${slot.issue}\` and post its output in #hiring.`,
  ].join("\n");
}
