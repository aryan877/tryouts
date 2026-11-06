import { mkdir, rm } from "node:fs/promises";
import { git, run } from "./git";

export async function exportTree(
  repo: string,
  sha: string,
  dest: string,
  paths: string[] = [],
): Promise<void> {
  const archive = `${dest}.tar`;
  await mkdir(dest, { recursive: true });
  await git(repo, "archive", "--format=tar", `--output=${archive}`, sha, "--", ...paths);
  const { code, output } = await run(["tar", "-xf", archive, "-C", dest], repo);
  await rm(archive, { force: true });
  if (code !== 0) throw new Error(`Extracting ${sha} failed: ${output}`);
}
