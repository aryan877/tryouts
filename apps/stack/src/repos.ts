import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { DEMO, ORIGIN, PEOPLE, ROOT } from "./config";
import { sh, step } from "./shell";

export async function prepareOrigin(): Promise<void> {
  if (await Bun.file(join(ORIGIN, "HEAD")).exists()) return;
  step("Publishing tinychunk to a local origin (stands in for GitHub)");
  const seed = join(DEMO, "seed/tinychunk");
  await mkdir(seed, { recursive: true });
  const source = join(ROOT, "examples/tinychunk");
  for (const entry of await readdir(source)) {
    if (entry !== "node_modules")
      await cp(join(source, entry), join(seed, entry), { recursive: true });
  }
  const { name, email } = PEOPLE.lead;
  await sh(["git", "init", "--quiet", "-b", "main"], seed);
  await sh(["git", "add", "-A"], seed);
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
    seed,
  );
  await sh(["git", "clone", "--quiet", "--bare", seed, ORIGIN], DEMO);
}
