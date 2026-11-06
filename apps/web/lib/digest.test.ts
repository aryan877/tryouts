import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git, type ProofReport, verify } from "@tryouts/referee";
import { digestOf, evidenceOf } from "./digest";
import { FIXTURE } from "./fixture";

let repo: string;

async function commit(files: Record<string, string>, message: string) {
  for (const [path, content] of Object.entries(files)) await Bun.write(join(repo, path), content);
  await git(repo, "add", "-A");
  await git(repo, "commit", "--quiet", "-m", message);
}

beforeAll(async () => {
  repo = await mkdtemp(join(tmpdir(), "tryouts-web-digest-"));
  await git(repo, "init", "--quiet", "-b", "main");
  await git(repo, "config", "user.email", "test@tryouts.local");
  await git(repo, "config", "user.name", "Digest Test");
  await commit(
    {
      "referee.json": JSON.stringify({
        test: ["sh", "-c", "test ! -f test/regression.test.ts || grep -q fixed src/value.ts"],
        scope: ["src/", "test/"],
        timeoutMs: 5_000,
        sandbox: false,
      }),
      "src/value.ts": "export const value = 'bug';\n",
    },
    "base",
  );
  await git(repo, "checkout", "--quiet", "-b", "tryout/codex-12");
  await commit(
    {
      "src/value.ts": "export const value = 'fixed';\n",
      "test/regression.test.ts": "// fails on the base, passes with the fix\n",
    },
    "fix",
  );
  await git(repo, "checkout", "--quiet", "main");
});

afterAll(() => rm(repo, { recursive: true, force: true }));

describe("digest", () => {
  test("the browser digest equals the referee's digest for a real verify() report", async () => {
    const report = await verify({ repo, head: "tryout/codex-12" });
    expect(report.verdict).toBe("verified");
    expect(await digestOf(report)).toBe(report.digest);
  });

  test("a report changed after the referee ran no longer matches", async () => {
    const report = await verify({ repo, head: "tryout/codex-12" });
    const edited: ProofReport = {
      ...report,
      checks: report.checks.map((check) =>
        check.id === "test-catches-bug" ? { ...check, passed: !check.passed } : check,
      ),
    };
    expect(await digestOf(edited)).not.toBe(report.digest);
  });

  test("key order inside changed does not depend on how the record was serialised", async () => {
    const report = await verify({ repo, head: "tryout/codex-12" });
    const { tests, source, deleted, outOfScope } = report.changed;
    const shuffled = { ...report, changed: { outOfScope, deleted, source, tests } };
    expect(await digestOf(shuffled)).toBe(report.digest);
  });

  test("every report in the sample record carries its own correct digest", async () => {
    for (const c of FIXTURE.candidates) {
      if (!c.report) continue;
      const expected = `sha256:${createHash("sha256").update(evidenceOf(c.report)).digest("hex")}`;
      expect(c.report.digest).toBe(expected);
      expect(await digestOf(c.report)).toBe(expected);
    }
  });
});
