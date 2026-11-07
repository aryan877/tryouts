import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git, type RunResult, run } from "./git";
import { runTests } from "./sandbox";
import { type Check, ProofConfig, type ProofReport } from "./schema";
import { exportTree } from "./tree";

export const CONFIG_FILE = "referee.json";
const SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const FULL_SHA = /^[0-9a-f]{40}$/;
const OUTPUT_TAIL = 1_500;

export interface VerifyOptions {
  repo: string;
  head: string;
  base?: string;
  fork?: string;
}

interface Change {
  status: string;
  path: string;
}

interface Revisions {
  baseSha: string;
  headSha: string;
  tests: string[];
  added: string[];
  command: string;
}

export async function verify({
  repo,
  head,
  base = "main",
  fork,
}: VerifyOptions): Promise<ProofReport> {
  for (const ref of [head, base]) {
    if (!SAFE_REF.test(ref) || ref.includes("..")) {
      throw new Error(`"${ref}" is not a branch name the referee will check.`);
    }
  }
  const started = performance.now();
  const work = await mkdtemp(join(tmpdir(), "referee-"));
  const clone = join(work, "repo");
  try {
    await git(work, "clone", "--quiet", "--no-hardlinks", "--no-checkout", "--", repo, clone);
    if (fork) {
      await git(
        clone,
        "fetch",
        "--quiet",
        "--no-tags",
        "--",
        fork,
        `+refs/heads/${head}:refs/remotes/fork/${head}`,
      );
    }
    const headSha = await resolve(clone, `refs/remotes/${fork ? "fork" : "origin"}/${head}`, head);
    const baseSha = await resolveBase(clone, base);
    const config = await readConfig(clone, baseSha);
    const upToDate = await isAncestor(clone, baseSha, headSha);
    const since = upToDate ? baseSha : await git(clone, "merge-base", baseSha, headSha);

    const changes = await diff(clone, since, headSha);
    const testMatch = new RegExp(config.testMatch);
    const isTest = (change: Change) => testMatch.test(change.path);
    const tests = changes.filter((c) => isTest(c) && c.status !== "D").map((c) => c.path);
    const deletedTests = changes.filter((c) => isTest(c) && c.status === "D").map((c) => c.path);
    const outOfScope = changes
      .map((c) => c.path)
      .filter((path) => isAttributes(path) || !config.scope.some((dir) => path.startsWith(dir)));
    const command = config.test.join(" ");

    const checks: Check[] = [
      {
        id: "up-to-date",
        title: "Based on the latest base",
        passed: upToDate,
        detail: upToDate
          ? `Contains ${base} @ ${baseSha.slice(0, 7)}, so the merge is exactly what was tested`
          : `Behind ${base} @ ${baseSha.slice(0, 7)}; rebase the branch onto it`,
      },
      {
        id: "has-regression-test",
        title: "Has a regression test",
        passed: tests.length > 0 && deletedTests.length === 0,
        detail:
          deletedTests.length > 0
            ? `Deletes test file(s): ${deletedTests.join(", ")}`
            : tests.length > 0
              ? tests.join(", ")
              : "The branch adds or changes no test file.",
      },
      {
        id: "in-scope",
        title: "Stays in scope",
        passed: outOfScope.length === 0,
        detail:
          outOfScope.length === 0
            ? `${changes.length} file(s), all inside ${config.scope.join(", ")}`
            : `Not allowed: ${outOfScope.join(", ")} (only ${config.scope.join(", ")}, never git attributes)`,
      },
    ];

    checks.push(await fixPasses(clone, config, work, { since, headSha, changes, isTest, command }));

    const added = changes.filter((c) => c.status === "A").map((c) => c.path);
    checks.push(
      await testCatchesBug(clone, config, work, { baseSha, headSha, tests, added, command }),
    );

    const verdict = checks.every((check) => check.passed) ? "verified" : "refuted";
    const changed = {
      tests,
      source: changes.filter((c) => !isTest(c) && c.status !== "D").map((c) => c.path),
      deleted: changes.filter((c) => c.status === "D").map((c) => c.path),
      outOfScope,
    };
    const evidence = {
      base: baseSha,
      head: headSha,
      sandboxed: config.sandbox !== false,
      checks: checks.map(({ id, passed }) => ({ id, passed })),
      changed,
    };
    return {
      version: 1,
      repo,
      ...(fork ? { fork } : {}),
      head: { ref: head, sha: headSha },
      base: { ref: base, sha: baseSha },
      verdict,
      sandboxed: config.sandbox !== false,
      checks,
      changed,
      durationMs: Math.round(performance.now() - started),
      digest: `sha256:${createHash("sha256").update(JSON.stringify(evidence)).digest("hex")}`,
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

async function fixPasses(
  clone: string,
  config: ProofConfig,
  work: string,
  revisions: {
    since: string;
    headSha: string;
    changes: Change[];
    isTest: (change: Change) => boolean;
    command: string;
  },
): Promise<Check> {
  const check = { id: "fix-passes", title: "Fix passes" } as const;
  const { command } = revisions;
  const onHead = await testTree(clone, config, join(work, "head"), revisions.headSha);
  const reworked = revisions.changes
    .filter((c) => revisions.isTest(c) && c.status === "M")
    .map((c) => c.path);
  if (!passed(onHead) || reworked.length === 0) {
    return {
      ...check,
      passed: passed(onHead),
      detail: outcome(onHead, command, "on the branch"),
      output: tail(onHead.output),
    };
  }
  const original = await testTree(clone, config, join(work, "original"), revisions.headSha, {
    sha: revisions.since,
    paths: reworked,
  });
  return {
    ...check,
    passed: passed(original),
    detail: passed(original)
      ? `${outcome(onHead, command, "on the branch")}, and with the original ${reworked.join(", ")}`
      : `With the original ${reworked.join(", ")}, ${outcome(original, command, "on the branch")}: an existing test was weakened`,
    output: tail(original.output),
  };
}

async function testCatchesBug(
  clone: string,
  config: ProofConfig,
  work: string,
  revisions: Revisions,
): Promise<Check> {
  const check = { id: "test-catches-bug", title: "Test catches the bug" } as const;
  if (revisions.tests.length === 0) {
    return { ...check, passed: false, detail: "There is no new test to run against the base." };
  }
  const baseline = await testTree(clone, config, join(work, "base"), revisions.baseSha);
  if (!passed(baseline)) {
    return {
      ...check,
      passed: false,
      detail: `The base itself does not pass (${outcome(baseline, revisions.command, "on the base")}), so a failure proves nothing.`,
      output: tail(baseline.output),
    };
  }
  const probe = await testTree(clone, config, join(work, "probe"), revisions.baseSha, {
    sha: revisions.headSha,
    paths: [...new Set([...revisions.tests, ...revisions.added])],
  });
  const caught = !probe.timedOut && probe.code !== 0;
  return {
    ...check,
    passed: caught,
    detail: caught
      ? `The new tests fail on the base without the fix (\`${revisions.command}\` exits ${probe.code})`
      : probe.timedOut
        ? "The new tests timed out on the base; a timeout is not evidence of the bug."
        : "The new tests also pass without the fix, so they do not prove the bug is fixed.",
    output: tail(probe.output),
  };
}

export async function testTree(
  clone: string,
  config: ProofConfig,
  dir: string,
  sha: string,
  overlay?: { sha: string; paths: string[] },
): Promise<RunResult> {
  await exportTree(clone, sha, dir);
  if (overlay) await exportTree(clone, overlay.sha, dir, overlay.paths);
  return runTests(config, dir);
}

export const passed = (result: RunResult) => !result.timedOut && result.code === 0;

const isAttributes = (path: string) => path.split("/").at(-1) === ".gitattributes";

function outcome(result: RunResult, command: string, where: string): string {
  return result.timedOut
    ? `\`${command}\` timed out ${where}`
    : `\`${command}\` exits ${result.code} ${where}`;
}

async function diff(clone: string, from: string, to: string): Promise<Change[]> {
  const fields = (await git(clone, "diff", "--name-status", "--no-renames", "-z", from, to))
    .split("\0")
    .filter(Boolean);
  const changes: Change[] = [];
  for (let i = 0; i + 1 < fields.length; i += 2) {
    changes.push({ status: fields[i] as string, path: fields[i + 1] as string });
  }
  return changes;
}

async function isAncestor(clone: string, ancestor: string, descendant: string) {
  const { code } = await run(["git", "merge-base", "--is-ancestor", ancestor, descendant], clone);
  return code === 0;
}

async function resolve(clone: string, ref: string, name: string): Promise<string> {
  const { code, output } = await run(
    ["git", "rev-parse", "--verify", "--quiet", `${ref}^{commit}`],
    clone,
  );
  if (code !== 0) throw new Error(`Cannot find "${name}" in the repository.`);
  return output;
}

export async function resolveBase(clone: string, base: string): Promise<string> {
  if (!FULL_SHA.test(base)) return resolve(clone, `refs/remotes/origin/${base}`, base);
  const sha = await resolve(clone, base, base);
  const upstream = await git(clone, "for-each-ref", "--contains", sha, "refs/remotes/origin");
  if (!upstream) throw new Error(`${base} is not on the upstream repository.`);
  return sha;
}

export async function readConfig(clone: string, sha: string): Promise<ProofConfig> {
  const { code, output } = await run(["git", "show", `${sha}:${CONFIG_FILE}`], clone);
  if (code !== 0) throw new Error(`The base has no ${CONFIG_FILE}; the maintainer must add one.`);
  return ProofConfig.parse(JSON.parse(output));
}

export async function checkRules(repo: string, base = "main"): Promise<void> {
  const work = await mkdtemp(join(tmpdir(), "referee-rules-"));
  try {
    await git(
      work,
      "clone",
      "--quiet",
      "--depth=1",
      "--no-checkout",
      "--branch",
      base,
      "--",
      repo,
      ".",
    );
    await readConfig(work, await git(work, "rev-parse", "HEAD"));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

function tail(text: string): string {
  return text.length > OUTPUT_TAIL ? `…${text.slice(-OUTPUT_TAIL)}` : text;
}
