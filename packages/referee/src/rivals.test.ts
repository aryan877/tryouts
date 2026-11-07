import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFixture } from "./fixture";
import { git } from "./git";
import { type Fix, rivals } from "./rivals";
import { checkRules, verify } from "./verify";

let repo: string;

const fixOf = async (head: string): Promise<Fix> => {
  const report = await verify({ repo, head });
  return { name: head, fork: repo, head, sha: report.head.sha, tests: report.changed.tests };
};

beforeAll(async () => {
  repo = await createFixture();
});
afterAll(() => rm(repo, { recursive: true, force: true }));

describe("rivals", () => {
  test("two real fixes pass each other's tests", async () => {
    const report = await rivals({ repo, fixes: [await fixOf("fix"), await fixOf("fix-too")] });
    expect(report.duels).toEqual([
      { fix: "fix", tests: "fix-too", passed: true },
      { fix: "fix-too", tests: "fix", passed: true },
    ]);
  });

  test("a branch that fixes nothing gets five green checks, and fails a rival's test", async () => {
    const fake = await verify({ repo, head: "fake-fix" });
    expect(fake.verdict).toBe("verified");
    const report = await rivals({ repo, fixes: [await fixOf("fix"), await fixOf("fake-fix")] });
    expect(report.duels).toContainEqual({ fix: "fake-fix", tests: "fix", passed: false });
  });

  test("it reports what each fix changed, read from the referee's own clone", async () => {
    const report = await rivals({ repo, fixes: [await fixOf("fix"), await fixOf("fix-too")] });
    const stat = report.stats.fix;
    expect(stat?.files).toEqual(["src/double.ts", "test/double.test.ts"]);
    expect(stat?.added).toBeGreaterThan(0);
    expect(stat?.patch).toContain("n * 2");
  });

  test("the digest depends on the results, not on when it ran", async () => {
    const fixes = [await fixOf("fix"), await fixOf("fix-too")];
    expect((await rivals({ repo, fixes })).digest).toBe((await rivals({ repo, fixes })).digest);
  });
});

test("a repository without referee rules is refused before anyone spends tokens", async () => {
  await checkRules(repo);
  const bare = await mkdtemp(join(tmpdir(), "referee-norules-"));
  try {
    await git(bare, "init", "--quiet", "-b", "main");
    await git(
      bare,
      "-c",
      "user.name=x",
      "-c",
      "user.email=x@x",
      "commit",
      "--quiet",
      "--allow-empty",
      "-m",
      "empty",
    );
    await expect(checkRules(bare)).rejects.toThrow("the maintainer must add one");
  } finally {
    await rm(bare, { recursive: true, force: true });
  }
});
