import { homedir } from "node:os";
import type { ProofReport, Verdict } from "./schema";

export interface ProofCard {
  verdict: Verdict;
  sandboxed: boolean;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  checks: { title: string; passed: boolean; detail: string }[];
  digest: string;
  rerun: string;
}

const HEADER =
  /^\*\*Referee · (?<verdict>VERIFIED|REFUTED)\*\*(?<unsandboxed> · unsandboxed)? `(?<headRef>[^`]+)` @ `(?<headSha>[0-9a-f]{40})` against `(?<baseRef>[^`]+)` @ `(?<baseSha>[0-9a-f]+)`$/m;
const CHECK = /^- (?<mark>✅|❌) \*\*(?<title>[^*]+)\*\* (?<detail>.*)$/gm;
const DIGEST = /^Digest `(?<digest>sha256:[0-9a-f]{64})` · re-run it yourself: `(?<rerun>[^`]+)`$/m;

const HOME = `${homedir()}/`;
const tidy = (location: string) =>
  location.startsWith(HOME) ? `~/${location.slice(HOME.length)}` : location;

export function renderCard(report: ProofReport): string {
  const short = (sha: string) => sha.slice(0, 7);
  const rerun = [
    "tryouts verify",
    `--repo ${tidy(report.repo)}`,
    ...(report.fork ? [`--fork ${tidy(report.fork)}`] : []),
    `--head ${report.head.ref}`,
    `--base ${report.base.sha}`,
  ].join(" ");
  return [
    `**Referee · ${report.verdict.toUpperCase()}**${report.sandboxed ? "" : " · unsandboxed"} \`${report.head.ref}\` @ \`${report.head.sha}\` against \`${report.base.ref}\` @ \`${short(report.base.sha)}\``,
    ...report.checks.map(
      (check) => `- ${check.passed ? "✅" : "❌"} **${check.title}** ${check.detail}`,
    ),
    `Digest \`${report.digest}\` · re-run it yourself: \`${rerun}\``,
  ].join("\n");
}

function locate(text: string) {
  const header = HEADER.exec(text);
  if (!header?.groups) return null;
  const digest = DIGEST.exec(text.slice(header.index));
  if (!digest?.groups) return null;
  return {
    header: header.groups,
    digest: digest.groups,
    start: header.index,
    end: header.index + digest.index + digest[0].length,
  };
}

export function stripCard(text: string): string {
  const card = locate(text);
  return card ? `${text.slice(0, card.start)}${text.slice(card.end)}`.trim() : text;
}

export function parseCard(text: string): ProofCard | null {
  const card = locate(text);
  if (!card) return null;
  const { verdict, unsandboxed, headRef, headSha, baseRef, baseSha } = card.header as Record<
    string,
    string | undefined
  >;
  return {
    verdict: verdict === "VERIFIED" ? "verified" : "refuted",
    sandboxed: !unsandboxed,
    head: { ref: headRef as string, sha: headSha as string },
    base: { ref: baseRef as string, sha: baseSha as string },
    checks: [...text.slice(card.start, card.end).matchAll(CHECK)].map(({ groups }) => ({
      title: groups?.title as string,
      passed: groups?.mark === "✅",
      detail: groups?.detail as string,
    })),
    digest: card.digest.digest as string,
    rerun: card.digest.rerun as string,
  };
}
