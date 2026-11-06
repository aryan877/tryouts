import type { ProofReport } from "@tryouts/referee";

export function evidenceOf(report: ProofReport): string {
  const { tests, source, deleted, outOfScope } = report.changed;
  return JSON.stringify({
    base: report.base.sha,
    head: report.head.sha,
    sandboxed: report.sandboxed,
    checks: report.checks.map(({ id, passed }) => ({ id, passed })),
    changed: { tests, source, deleted, outOfScope },
  });
}

export async function digestOf(report: ProofReport): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(evidenceOf(report)));
  const hex = Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

export function rerunOf(report: ProofReport): string {
  return [
    "tryouts verify",
    `--repo ${report.repo}`,
    ...(report.fork ? [`--fork ${report.fork}`] : []),
    `--head ${report.head.ref}`,
    `--base ${report.base.sha}`,
  ].join(" ");
}
