import { afterAll, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "@tryouts/referee";
import { commitTime, type Slot } from "./bench";

const dirs: string[] = [];
afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

async function signedFork(marker: string) {
  const fork = await mkdtemp(join(tmpdir(), "tryouts-fork-"));
  dirs.push(fork);
  await git(fork, "init", "--quiet", "-b", "main");
  const tree = await git(fork, "write-tree");
  const body = [
    `tree ${tree}`,
    "author Candidate <c@example.com> 1700000000 +0000",
    "committer Candidate <c@example.com> 1700000123 +0000",
    "gpgsig -----BEGIN PGP SIGNATURE-----",
    " fake",
    " -----END PGP SIGNATURE-----",
    "",
    "fix",
    "",
  ].join("\n");
  await writeFile(join(fork, "commit.txt"), body);
  const sha = await git(fork, "hash-object", "-t", "commit", "-w", "commit.txt");
  const program = join(fork, "gpg.sh");
  await writeFile(program, `#!/bin/sh\ntouch ${marker}\n`);
  await chmod(program, 0o755);
  await git(fork, "config", "log.showSignature", "true");
  await git(fork, "config", "gpg.program", program);
  return { fork, sha };
}

describe("commitTime", () => {
  test("reads the committer time without running a program the candidate planted", async () => {
    const marker = join(tmpdir(), `tryouts-gpg-ran-${process.pid}`);
    await rm(marker, { force: true });
    const { fork, sha } = await signedFork(marker);
    const slot = { fork } as Slot;
    expect((await commitTime(slot, sha)).getTime()).toBe(1700000123 * 1000);
    expect(await Bun.file(marker).exists()).toBe(false);
  });
});
