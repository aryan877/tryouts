import { mkdtemp, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { type FixStat, git } from "@tryouts/referee";
import type { Slot } from "./bench";
import type { Config } from "./config";

const GITHUB = /github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/;
const PATCH_LINES = 40;

export const githubRepo = (repository: string) => GITHUB.exec(repository)?.[1] ?? null;

async function gh(path: string, ...args: string[]): Promise<string> {
  const proc = Bun.spawn([path, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, GH_CONFIG_DIR: join(homedir(), ".config/gh") },
  });
  const [out, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
  if (code !== 0) throw new Error(`gh ${args[0]} ${args[1]} failed`);
  return out.trim();
}

export async function openReview(
  config: Config,
  slot: Slot,
  sha: string,
  title: string,
  body: string,
): Promise<string | null> {
  const repo = githubRepo(config.repository);
  const cli = Bun.which("gh");
  if (!repo || !cli) return null;
  const work = await mkdtemp(join(tmpdir(), "tryouts-review-"));
  try {
    await git(work, "clone", "--quiet", "--bare", "--", config.repository, "origin.git");
    const origin = join(work, "origin.git");
    await git(
      origin,
      "fetch",
      "--quiet",
      "--no-tags",
      "--",
      slot.fork,
      `refs/heads/${slot.branch}`,
    );
    await git(origin, "push", "--quiet", "--force", "origin", `${sha}:refs/heads/${slot.branch}`);
    const open = await gh(
      cli,
      "pr",
      "list",
      "--repo",
      repo,
      "--head",
      slot.branch,
      "--state",
      "open",
      "--json",
      "url",
      "--jq",
      ".[0].url // empty",
    );
    if (open) return open;
    return await gh(
      cli,
      "pr",
      "create",
      "--repo",
      repo,
      "--base",
      "main",
      "--head",
      slot.branch,
      "--title",
      title,
      "--body",
      body,
    );
  } catch {
    return null;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

export function renderFix(agent: string, stat: FixStat, url: string | null): string {
  const patch = stat.patch.split("\n").filter((line) => !/^(diff --git|index )/.test(line));
  const shown = patch.slice(0, PATCH_LINES);
  const rest = patch.length - shown.length;
  return [
    `**What you'd approve: ${agent}'s fix** · +${stat.added} −${stat.removed} in ${stat.files.join(", ")}`,
    ...(url ? [`Pull request: ${url}`] : []),
    "```diff",
    ...shown,
    ...(rest > 0 ? [`… ${rest} more lines`] : []),
    "```",
  ].join("\n");
}
