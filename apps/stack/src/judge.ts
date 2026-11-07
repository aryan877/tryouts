#!/usr/bin/env bun
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SavedRivals } from "@tryouts/cli/board";
import type { TryoutRecord } from "@tryouts/kit/record";
import { git, type ProofReport, rivals, verify } from "@tryouts/referee";
import { ROOT } from "./config";

const EVIDENCE = join(ROOT, "evidence");
const mark = (ok: boolean) => (ok ? "\x1b[32m✔\x1b[0m" : "\x1b[31m✘\x1b[0m");
let failures = 0;
const expect = (ok: boolean, line: string) => {
  if (!ok) failures++;
  console.log(`  ${mark(ok)} ${line}`);
};

async function replay(dir: string, origin: string, name: string): Promise<void> {
  const recorded = (await Bun.file(join(dir, "reports", `${name}.json`)).json()) as ProofReport;
  const again = await verify({
    repo: origin,
    fork: join(dir, "branches", `${name}.bundle`),
    head: recorded.head.ref,
    base: recorded.base.sha,
  });
  expect(
    again.digest === recorded.digest && again.verdict === recorded.verdict,
    `${name}: ${again.verdict.toUpperCase()} again, digest ${again.digest.slice(0, 19)}… ${again.digest === recorded.digest ? "matches" : `differs from ${recorded.digest.slice(0, 19)}…`}`,
  );
}

async function duels(dir: string, origin: string, issue: number): Promise<void> {
  const file = Bun.file(join(dir, "rivals.json"));
  if (!(await file.exists())) return;
  const recorded = (await file.json()) as SavedRivals;
  const again = await rivals({
    repo: origin,
    base: recorded.report.base,
    fixes: recorded.fixes.map((fix) => ({
      ...fix,
      fork: join(dir, "branches", `${fix.name}-${issue}.bundle`),
    })),
  });
  const held = recorded.report.duels.filter((duel) => duel.passed).length;
  expect(
    again.digest === recorded.report.digest,
    `rival tests: ${held} of ${recorded.report.duels.length} pass again, digest ${again.digest === recorded.report.digest ? "matches" : "differs"}`,
  );
}

async function merged(origin: string, label: string, sha: string, merge: string, digest: string) {
  const parents = (await git(origin, "rev-list", "--parents", "-n", "1", merge)).split(" ");
  const message = await git(origin, "log", "-1", "--format=%B", merge);
  expect(
    parents.includes(sha) && message.includes(`Referee: ${digest}`),
    `${label}: main has ${merge.slice(0, 7)}, merging exactly ${sha.slice(0, 7)} with the referee's digest`,
  );
}

for (const folder of (await readdir(EVIDENCE).catch(() => [])).filter((f) =>
  f.startsWith("tryout-"),
)) {
  const dir = join(EVIDENCE, folder);
  const record = (await Bun.file(join(dir, "record.json")).json()) as TryoutRecord;
  console.log(`\nTryout #${record.issue}: ${record.title}`);
  const work = await mkdtemp(join(tmpdir(), "tryouts-judge-"));
  try {
    const origin = join(work, "origin.git");
    await git(work, "clone", "--quiet", "--bare", join(dir, "origin.bundle"), origin);
    for (const name of (await readdir(join(dir, "reports"))).map((f) => f.replace(/\.json$/, ""))) {
      await replay(dir, origin, name);
    }
    await duels(dir, origin, record.issue);
    if (record.hire) {
      const { hire } = record;
      await merged(origin, `hire of ${hire.agent}`, hire.sha, hire.merged, hire.digest);
    }
    for (const fix of record.probation.fixes) {
      await merged(origin, `#${fix.issue} by ${fix.agent}`, fix.sha, fix.merged, fix.digest);
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

console.log(
  failures
    ? `\n${mark(false)} ${failures} check(s) failed`
    : `\n${mark(true)} Every recorded verdict and merge holds`,
);
process.exit(failures ? 1 : 0);
