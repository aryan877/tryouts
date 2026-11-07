import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "./git";
import { passed, readConfig, resolveBase, testTree } from "./verify";

export interface Fix {
  name: string;
  fork: string;
  head: string;
  sha: string;
  tests: string[];
}

export interface Duel {
  fix: string;
  tests: string;
  passed: boolean;
}

export interface FixStat {
  added: number;
  removed: number;
  files: string[];
  patch: string;
}

export interface RivalReport {
  base: string;
  duels: Duel[];
  stats: Record<string, FixStat>;
  digest: string;
}

const NUMSTAT = /^(\d+|-)\t(\d+|-)\t(.+)$/;

async function statOf(clone: string, base: string, sha: string): Promise<FixStat> {
  const rows = (await git(clone, "diff", "--numstat", "--no-renames", base, sha))
    .split("\n")
    .map((row) => NUMSTAT.exec(row))
    .filter((row): row is RegExpExecArray => row !== null);
  const count = (value: string | undefined) => (value === "-" ? 0 : Number(value));
  return {
    added: rows.reduce((sum, row) => sum + count(row[1]), 0),
    removed: rows.reduce((sum, row) => sum + count(row[2]), 0),
    files: rows.map((row) => row[3] as string),
    patch: await git(clone, "diff", "--no-color", "--no-ext-diff", "--no-textconv", base, sha),
  };
}

export async function rivals({
  repo,
  base = "main",
  fixes,
}: {
  repo: string;
  base?: string;
  fixes: Fix[];
}): Promise<RivalReport> {
  const work = await mkdtemp(join(tmpdir(), "referee-rivals-"));
  const clone = join(work, "repo");
  try {
    await git(work, "clone", "--quiet", "--no-hardlinks", "--no-checkout", "--", repo, clone);
    for (const fix of fixes) {
      await git(clone, "fetch", "--quiet", "--no-tags", "--", fix.fork, `refs/heads/${fix.head}`);
    }
    const baseSha = await resolveBase(clone, base);
    const config = await readConfig(clone, baseSha);
    const duels: Duel[] = [];
    for (const [i, fix] of fixes.entries()) {
      for (const [j, tests] of fixes.entries()) {
        if (i === j || tests.tests.length === 0) continue;
        const result = await testTree(clone, config, join(work, `${i}-${j}`), fix.sha, {
          sha: tests.sha,
          paths: tests.tests,
        });
        duels.push({ fix: fix.name, tests: tests.name, passed: passed(result) });
      }
    }
    const stats = Object.fromEntries(
      await Promise.all(
        fixes.map(async (fix) => [fix.name, await statOf(clone, baseSha, fix.sha)] as const),
      ),
    );
    const digest = createHash("sha256")
      .update(JSON.stringify({ base: baseSha, duels, shas: fixes.map((f) => [f.name, f.sha]) }))
      .digest("hex");
    return { base: baseSha, duels, stats, digest: `sha256:${digest}` };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
