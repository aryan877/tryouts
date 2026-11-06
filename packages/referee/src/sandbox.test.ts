import { afterAll, beforeAll, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { createFixture } from "./fixture";
import { git, run } from "./git";
import { verify } from "./verify";

const IMAGE = "oven/bun:1.2.23-alpine";
const docker = (await run(["docker", "image", "inspect", IMAGE], ".")).code === 0;
let repo: string;

beforeAll(async () => {
  if (!docker) return;
  repo = await createFixture({ sandbox: { image: IMAGE } });
  await git(repo, "checkout", "--quiet", "-b", "phones-home", "main");
  await Bun.write(
    `${repo}/test/double.test.ts`,
    `import { expect, test } from "bun:test";
test("reaches the network", async () => {
  expect((await fetch("https://example.com")).ok).toBe(true);
});\n`,
  );
  await git(repo, "commit", "--quiet", "-am", "phones home");
});

afterAll(() => repo && rm(repo, { recursive: true, force: true }));

test.skipIf(!docker)(
  "sandboxed tests run in a container without the network",
  async () => {
    const report = await verify({ repo, head: "phones-home" });
    expect(report.sandboxed).toBe(true);
    const fixPasses = report.checks.find((check) => check.id === "fix-passes");
    expect(fixPasses?.passed).toBe(false);
  },
  60_000,
);

test.skipIf(!docker)(
  "a real fix still verifies inside the sandbox",
  async () => {
    expect((await verify({ repo, head: "fix" })).verdict).toBe("verified");
  },
  60_000,
);
