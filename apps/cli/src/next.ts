import type { ProofReport } from "@tryouts/referee";
import type { Slot } from "./bench";

export function nextSteps(slot: Slot, report: ProofReport, waiting: string[]): string {
  const verdict = report.verdict.toUpperCase();
  if (slot.issue !== slot.tryout) {
    return report.verdict === "verified"
      ? `Next: in #hiring, post exactly: @hiring ${slot.agent}: VERIFIED for #${slot.issue}, commit ${report.head.sha}.`
      : `Next: tell @${slot.agent} in this room which checks failed. Post nothing in #hiring.`;
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
