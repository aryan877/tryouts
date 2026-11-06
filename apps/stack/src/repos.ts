import { cp, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GITHUB_REPO, ISSUES, MIRROR, ORIGIN, PEOPLE, REPOSITORY, ROOT } from "./config";
import { sh, step } from "./shell";

async function seedCommit(dir: string): Promise<void> {
  const source = join(ROOT, "examples/tinychunk");
  for (const entry of await readdir(source)) {
    if (entry !== "node_modules")
      await cp(join(source, entry), join(dir, entry), { recursive: true });
  }
  const { name, email } = PEOPLE.lead;
  await sh(["git", "init", "--quiet", "-b", "main"], dir);
  await sh(["git", "add", "-A"], dir);
  await sh(
    [
      "git",
      "-c",
      `user.name=${name}`,
      "-c",
      `user.email=${email}`,
      "commit",
      "-qm",
      "tinychunk 1.0.0",
    ],
    dir,
  );
}

export async function prepareOrigin(): Promise<void> {
  if (GITHUB_REPO || (await Bun.file(join(ORIGIN, "HEAD")).exists())) return;
  step("Publishing tinychunk to a local origin (stands in for GitHub)");
  const seed = await mkdtemp(join(tmpdir(), "tinychunk-"));
  try {
    await seedCommit(seed);
    await mkdir(join(ORIGIN, ".."), { recursive: true });
    await sh(["git", "clone", "--quiet", "--bare", seed, ORIGIN], ROOT);
  } finally {
    await rm(seed, { recursive: true, force: true });
  }
}

interface Issue {
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
}

export async function publishGithub(): Promise<void> {
  if (!GITHUB_REPO)
    throw new Error("Set TRYOUTS_REPOSITORY to an https://github.com/<owner>/<name> URL.");
  const exists = await sh(["gh", "repo", "view", GITHUB_REPO, "--json", "name"], ROOT).catch(
    () => null,
  );
  if (!exists) {
    step(`Creating ${GITHUB_REPO} on GitHub`);
    await sh(
      [
        "gh",
        "repo",
        "create",
        GITHUB_REPO,
        "--public",
        "--description",
        "A tiny library whose bugs AI agents try out to fix. The demo company for Tryouts.",
      ],
      ROOT,
    );
  }
  const previous = (await sh(["git", "ls-remote", REPOSITORY, "refs/heads/main"], ROOT)).split(
    "\t",
  )[0];
  if (previous) {
    const tag = `run-${new Date().toISOString().slice(0, 16).replace(/\D/g, "")}`;
    step(`Tagging the previous run as ${tag}, so its commits stay on GitHub`);
    await sh(["git", "push", "--quiet", REPOSITORY, `${previous}:refs/tags/${tag}`], ROOT);
  }
  step(`Resetting ${GITHUB_REPO} to tinychunk 1.0.0, with both bugs in place`);
  const seed = await mkdtemp(join(tmpdir(), "tinychunk-"));
  try {
    await seedCommit(seed);
    await sh(["git", "push", "--quiet", "--force", REPOSITORY, "HEAD:refs/heads/main"], seed);
  } finally {
    await rm(seed, { recursive: true, force: true });
  }
  const listed = JSON.parse(
    await sh(
      [
        "gh",
        "issue",
        "list",
        "--repo",
        GITHUB_REPO,
        "--state",
        "all",
        "--json",
        "number,title,state",
      ],
      ROOT,
    ),
  ) as Issue[];
  for (const issue of [ISSUES.tryout, ISSUES.probation]) {
    const found = listed.find((i) => i.number === issue.number);
    if (!found) {
      const url = await sh(
        [
          "gh",
          "issue",
          "create",
          "--repo",
          GITHUB_REPO,
          "--title",
          issue.title,
          "--body",
          issue.body,
        ],
        ROOT,
      );
      if (!url.endsWith(`/${issue.number}`))
        throw new Error(`Expected issue #${issue.number}, got ${url}.`);
      step(`Opened #${issue.number}: ${issue.title}`);
    } else if (found.state === "CLOSED") {
      await sh(["gh", "issue", "reopen", String(issue.number), "--repo", GITHUB_REPO], ROOT);
      step(`Reopened #${issue.number}: ${issue.title}`);
    }
  }
}

export async function mirror(): Promise<string> {
  if (!GITHUB_REPO) return ORIGIN;
  if (await Bun.file(join(MIRROR, "HEAD")).exists()) {
    await sh(
      ["git", "fetch", "--quiet", "--prune", "origin", "+refs/heads/*:refs/heads/*"],
      MIRROR,
    );
  } else {
    await mkdir(join(MIRROR, ".."), { recursive: true });
    await sh(["git", "clone", "--quiet", "--bare", REPOSITORY, MIRROR], ROOT);
  }
  return MIRROR;
}
