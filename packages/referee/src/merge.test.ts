import { afterEach, expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BRANCHES, createFixture } from "./fixture";
import { git } from "./git";
import { merge } from "./merge";

const committer = { name: "Maintainer", email: "maintainer@referee.local" };
const roots: string[] = [];

async function upstream() {
  const root = await mkdtemp(join(tmpdir(), "referee-merge-"));
  roots.push(root);
  const fixture = await createFixture();
  const origin = join(root, "origin.git");
  await git(root, "clone", "--quiet", "--bare", fixture, origin);
  await rm(fixture, { recursive: true, force: true });
  const tip = (ref: string, repo = origin) => git(repo, "rev-parse", ref);
  return { root, origin, tip };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

test("a refuted branch is never merged", async () => {
  const { origin, tip } = await upstream();
  const before = await tip("main");
  const { report, merged } = await merge({
    repo: origin,
    committer,
    head: "weak-test",
    sha: await tip("weak-test"),
  });
  expect(report.verdict).toBe("refuted");
  expect(merged).toBeNull();
  expect(await tip("main")).toBe(before);
});

test("a branch that moved after approval is not merged", async () => {
  const { origin, tip } = await upstream();
  const before = await tip("main");
  const { merged, reason } = await merge({
    repo: origin,
    committer,
    head: "fix",
    sha: await tip("no-fix"),
  });
  expect(merged).toBeNull();
  expect(reason).toContain("moved");
  expect(await tip("main")).toBe(before);
});

test("an abbreviated commit id is not an approval", async () => {
  const { origin, tip } = await upstream();
  const sha = (await tip("fix")).slice(0, 7);
  await expect(merge({ repo: origin, committer, head: "fix", sha })).rejects.toThrow("full commit");
});

test("a verified branch is merged at the approved commit, with the digest recorded", async () => {
  const { origin, tip } = await upstream();
  const sha = await tip("fix");
  const { report, merged } = await merge({
    repo: origin,
    committer,
    head: "fix",
    sha,
  });
  expect(await tip("main")).toBe(merged as string);
  expect(await tip("main^2")).toBe(sha);
  expect(await git(origin, "log", "-1", "--format=%B", "main")).toContain(report.digest);
});

test("notes stay above the trailers, so both the issue link and every trailer survive", async () => {
  const { origin, tip } = await upstream();
  const { report } = await merge({
    repo: origin,
    committer,
    head: "fix",
    sha: await tip("fix"),
    notes: ["Fixes #1"],
    trailers: ["Hired: codex-1"],
  });
  expect(await git(origin, "log", "-1", "--format=%b", "main")).toStartWith("Fixes #1\n\n");
  expect(await git(origin, "log", "-1", "--format=%(trailers:only,unfold)", "main")).toBe(
    `Referee: ${report.digest}\nHired: codex-1`,
  );
});

test("a contributor's fork is verified and merged without write access to origin", async () => {
  const { root, origin, tip } = await upstream();
  const fork = join(root, "fork.git");
  const contributor = join(root, "contributor");
  await git(root, "clone", "--quiet", "--bare", origin, fork);
  await git(root, "clone", "--quiet", fork, contributor);
  await git(contributor, "checkout", "--quiet", "-b", "from-fork");
  for (const [path, content] of Object.entries(BRANCHES.fix)) {
    await writeFile(join(contributor, path), content);
  }
  await git(
    contributor,
    "-c",
    "user.name=C",
    "-c",
    "user.email=c@referee.local",
    "commit",
    "-qam",
    "fix",
  );
  await git(contributor, "push", "--quiet", "origin", "from-fork");

  const sha = await tip("from-fork", fork);
  const { report, merged } = await merge({ repo: origin, committer, head: "from-fork", sha, fork });
  expect(report.fork).toBe(fork);
  expect(merged).not.toBeNull();
  expect(await tip("main^2")).toBe(sha);
});

test("a push the upstream refuses comes back as a reason, with main untouched", async () => {
  const { origin, tip } = await upstream();
  const main = await tip("main");
  const hook = join(origin, "hooks", "pre-receive");
  await writeFile(hook, "#!/bin/sh\nexit 1\n");
  await chmod(hook, 0o755);
  const { merged, reason } = await merge({
    repo: origin,
    committer,
    head: "fix",
    sha: await tip("fix"),
  });
  expect(merged).toBeNull();
  expect(reason).toContain("moved while this was merging");
  expect(await tip("main")).toBe(main);
});

test("a refusal names the checks that failed", async () => {
  const { origin, tip } = await upstream();
  const { reason } = await merge({
    repo: origin,
    committer,
    head: "no-fix",
    sha: await tip("no-fix"),
  });
  expect(reason).toContain("Failed:");
});
