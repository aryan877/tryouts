import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { parseCard, renderCard } from "./card";
import { BEHIND, createFixture, MARKER } from "./fixture";
import { run } from "./git";
import type { CheckId, ProofReport } from "./schema";
import { verify } from "./verify";

let repo: string;

const passed = (report: ProofReport) =>
  Object.fromEntries(report.checks.map((check) => [check.id, check.passed])) as Record<
    CheckId,
    boolean
  >;

beforeAll(async () => {
  await rm(MARKER, { force: true });
  repo = await createFixture();
});

afterAll(() => rm(repo, { recursive: true, force: true }));

describe("verify", () => {
  test("a real fix with a regression test is verified", async () => {
    const report = await verify({ repo, head: "fix" });
    expect(report.verdict).toBe("verified");
    expect(report.changed).toEqual({
      tests: ["test/double.test.ts"],
      source: ["src/double.ts"],
      deleted: [],
      outOfScope: [],
    });
  });

  test("a test that also passes without the fix is refuted", async () => {
    const report = await verify({ repo, head: "weak-test" });
    expect(passed(report)).toMatchObject({ "fix-passes": true, "test-catches-bug": false });
  });

  test("a regression test without a fix is refuted", async () => {
    const report = await verify({ repo, head: "no-fix" });
    expect(passed(report)).toMatchObject({ "fix-passes": false, "test-catches-bug": true });
  });

  test("changes outside the maintainer's scope are refuted", async () => {
    const report = await verify({ repo, head: "sprawl" });
    expect(report.changed.outOfScope).toEqual(["README.md"]);
    expect(passed(report)["in-scope"]).toBe(false);
  });

  test("the branch cannot replace the maintainer's config", async () => {
    const report = await verify({ repo, head: "weakened-config" });
    expect(passed(report)).toMatchObject({ "in-scope": false, "fix-passes": false });
  });

  test("a branch behind the base is refuted, so what merges is what was tested", async () => {
    const report = await verify({ repo, head: BEHIND });
    expect(passed(report)["up-to-date"]).toBe(false);
    expect(report.verdict).toBe("refuted");
  });

  describe("attacks", () => {
    test("a file planted by the branch's run cannot fail the base run", async () => {
      const report = await verify({ repo, head: "planted-file" });
      expect(passed(report)["test-catches-bug"]).toBe(false);
    });

    test("a git hook planted by a test never runs", async () => {
      await verify({ repo, head: "planted-hook" });
      expect(await Bun.file(MARKER).exists()).toBe(false);
    });

    test("a test that only fails on the base because a new file is missing is refuted", async () => {
      const report = await verify({ repo, head: "import-trick" });
      expect(passed(report)["test-catches-bug"]).toBe(false);
    });

    test("deleting a test is refuted", async () => {
      const report = await verify({ repo, head: "deletes-test" });
      expect(report.changed.deleted).toEqual(["test/double.test.ts"]);
      expect(passed(report)["has-regression-test"]).toBe(false);
    });

    test("weakening an existing test is refuted, because the original test still runs", async () => {
      const report = await verify({ repo, head: "weakens-old-test" });
      expect(passed(report)).toMatchObject({ "fix-passes": false, "test-catches-bug": true });
      expect(report.checks.find((c) => c.id === "fix-passes")?.detail).toContain(
        "With the original test/double.test.ts",
      );
    });

    test("a .gitattributes file cannot hide an existing test from the run", async () => {
      const report = await verify({ repo, head: "hides-old-test" });
      expect(report.changed.outOfScope).toEqual(["test/.gitattributes"]);
      expect(passed(report)).toMatchObject({ "in-scope": false, "fix-passes": false });
    });

    test("renaming a file into scope still counts the file it removed", async () => {
      const report = await verify({ repo, head: "renames-into-scope" });
      expect(report.changed.outOfScope).toEqual(["README.md"]);
      expect(passed(report)["in-scope"]).toBe(false);
    });

    test("a run that hangs is cut off and is not evidence", async () => {
      const started = performance.now();
      const report = await verify({ repo, head: "hangs" });
      expect(performance.now() - started).toBeLessThan(20_000);
      expect(passed(report)["fix-passes"]).toBe(false);
      expect(report.checks.find((c) => c.id === "fix-passes")?.detail).toContain("timed out");
    }, 30_000);

    test("the base can only come from upstream, never from the contributor", async () => {
      const fork = await createFixture({ sandbox: false, test: ["sh", "-c", `touch ${MARKER}`] });
      try {
        await expect(verify({ repo, fork, head: "fix", base: "fork/fix" })).rejects.toThrow(
          'Cannot find "fork/fix"',
        );
        const forkSha = (await run(["git", "rev-parse", "main"], fork)).output;
        await expect(verify({ repo, fork, head: "fix", base: forkSha })).rejects.toThrow(
          "not on the upstream",
        );
        expect(await Bun.file(MARKER).exists()).toBe(false);
      } finally {
        await rm(fork, { recursive: true, force: true });
      }
    });

    test("a run without a sandbox says so on the card and in the digest", async () => {
      const report = await verify({ repo, head: "fix" });
      expect(renderCard(report)).toContain("VERIFIED** · unsandboxed");
      expect(parseCard(renderCard(report))?.sandboxed).toBe(false);
    });

    test("branch names that could smuggle options or shell syntax are refused", async () => {
      for (const head of ["--upload-pack=touch x", "fix/$(id)", "fix/12;ls", "../main", "fix 12"]) {
        await expect(verify({ repo, head })).rejects.toThrow("is not a branch name");
      }
    });
  });

  test("the digest depends on the evidence, not on when or where it ran", async () => {
    const [first, second] = await Promise.all([
      verify({ repo, head: "fix" }),
      verify({ repo: `file://${repo}`, head: "fix" }),
    ]);
    expect(first.digest).toBe(second.digest);
    expect(first.digest).not.toBe((await verify({ repo, head: "weak-test" })).digest);
  });

  test("the card's re-run command reproduces the digest", async () => {
    const report = await verify({ repo, head: "fix" });
    const rerun = parseCard(renderCard(report))?.rerun ?? "";
    const base = /--base (\S+)/.exec(rerun)?.[1] as string;
    expect(base).toBe(report.base.sha);
    expect((await verify({ repo, head: "fix", base })).digest).toBe(report.digest);
  });

  test("the chat card round-trips", async () => {
    const report = await verify({ repo, head: "weak-test" });
    const card = renderCard(report);
    expect(parseCard(`Reviewer:\n\n${card}\n\nMerged.`)).toMatchObject({
      verdict: "refuted",
      sandboxed: false,
      head: { ref: "weak-test", sha: report.head.sha },
      checks: report.checks.map(({ title, passed, detail }) => ({ title, passed, detail })),
      digest: report.digest,
    });
  });

  test("an unknown branch fails loudly", async () => {
    await expect(verify({ repo, head: "nope" })).rejects.toThrow('Cannot find "nope"');
  });
});
