import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "./git";
import type { ProofReport } from "./schema";
import { verify } from "./verify";

export interface MergeOptions {
  repo: string;
  head: string;
  sha: string;
  committer: { name: string; email: string };
  base?: string;
  fork?: string;
  notes?: string[];
  trailers?: string[];
}

export interface MergeResult {
  report: ProofReport;
  merged: string | null;
  reason: string | null;
}

export async function merge({
  repo,
  head,
  sha,
  committer,
  base = "main",
  fork,
  notes = [],
  trailers = [],
}: MergeOptions): Promise<MergeResult> {
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`"${sha}" is not a full commit id; approve all 40 characters.`);
  }
  const report = await verify({ repo, head, base, ...(fork ? { fork } : {}) });
  const refuse = (reason: string): MergeResult => ({ report, merged: null, reason });
  if (report.head.sha !== sha) {
    return refuse(`${head} moved to ${report.head.sha.slice(0, 7)} after ${sha} was approved.`);
  }
  if (report.verdict !== "verified") return refuse("the referee does not verify it.");

  const work = await mkdtemp(join(tmpdir(), "referee-merge-"));
  try {
    await git(work, "clone", "--quiet", "--", repo, ".");
    if (fork) await git(work, "fetch", "--quiet", "--no-tags", "--", fork, `refs/heads/${head}`);
    await git(work, "checkout", "--quiet", "--detach", report.base.sha);
    await git(
      work,
      "-c",
      `user.name=${committer.name}`,
      "-c",
      `user.email=${committer.email}`,
      "merge",
      "--quiet",
      "--no-ff",
      "-m",
      `Merge ${head}`,
      ...notes.flatMap((note) => ["-m", note]),
      "-m",
      [`Referee: ${report.digest}`, ...trailers].join("\n"),
      report.head.sha,
    );
    await git(work, "push", "--quiet", "origin", `HEAD:refs/heads/${base}`);
    return { report, merged: await git(work, "rev-parse", "HEAD"), reason: null };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
