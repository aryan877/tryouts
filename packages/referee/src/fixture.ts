import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "./git";

type Files = Record<string, string | null>;

const BUGGY = "export const double = (n: number) => n + n + (n > 9 ? 1 : 0);\n";
const FIXED = "export const double = (n: number) => n * 2;\n";
const HEADER = `import { expect, test } from "bun:test";
import { double } from "../src/double";
`;
const BASE_TEST = `${HEADER}test("small", () => expect(double(2)).toBe(4));\n`;
const REGRESSION = `${BASE_TEST}test("large", () => expect(double(10)).toBe(20));\n`;
const WEAK = `${BASE_TEST}test("zero", () => expect(double(0)).toBe(0));\n`;

export const MARKER = join(tmpdir(), "referee-hook-ran");

export const BRANCHES = {
  fix: { "src/double.ts": FIXED, "test/double.test.ts": REGRESSION },
  "weak-test": { "src/double.ts": FIXED, "test/double.test.ts": WEAK },
  "no-fix": { "test/double.test.ts": REGRESSION },
  sprawl: { "src/double.ts": FIXED, "test/double.test.ts": REGRESSION, "README.md": "# new\n" },
  "weakened-config": {
    "referee.json": JSON.stringify({ test: ["true"], scope: ["src/", "test/", "docs"] }),
    "test/double.test.ts": REGRESSION,
  },
  "planted-file": {
    "src/double.ts": FIXED,
    "test/double.test.ts": `${WEAK}import { writeFileSync } from "node:fs";
writeFileSync("test/zz-planted.test.ts", 'import { test } from "bun:test"; test("x", () => { throw 1; });');\n`,
  },
  "planted-hook": {
    "src/double.ts": FIXED,
    "test/double.test.ts": `${REGRESSION}import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
mkdirSync("../repo/.git/hooks", { recursive: true });
writeFileSync("../repo/.git/hooks/post-checkout", "#!/bin/sh\\ntouch ${MARKER}\\n");
chmodSync("../repo/.git/hooks/post-checkout", 0o755);\n`,
  },
  "import-trick": {
    "src/double.ts": FIXED,
    "src/version.ts": 'export const version = "1.0.1";\n',
    "test/double.test.ts": `${WEAK}import { version } from "../src/version";
test("version", () => expect(version).toBeTruthy());\n`,
  },
  "deletes-test": { "src/double.ts": FIXED, "test/double.test.ts": null, "test/new.test.ts": WEAK },
  "renames-into-scope": {
    "src/double.ts": FIXED,
    "test/double.test.ts": REGRESSION,
    "README.md": null,
    "src/README.md": "# fixture\n",
  },
  hangs: {
    "src/double.ts": FIXED,
    "test/double.test.ts": `${REGRESSION}Bun.spawn(["sleep", "60"], { stdout: "inherit" });
await new Promise(() => {});\n`,
  },
} satisfies Record<string, Files>;

export const BEHIND = "behind";

export async function createFixture(config: object = {}): Promise<string> {
  const repo = await mkdtemp(join(tmpdir(), "referee-fixture-"));
  const commit = async (files: Files, message: string) => {
    for (const [path, content] of Object.entries(files)) {
      if (content === null) await rm(join(repo, path));
      else await writeFile(join(repo, path), content);
    }
    await git(repo, "add", "-A");
    await git(repo, "commit", "--quiet", "-m", message);
  };
  const branch = async (name: string, files: Files) => {
    await git(repo, "checkout", "--quiet", "-b", name, "main");
    await commit(files, name);
    await git(repo, "checkout", "--quiet", "main");
  };

  await git(repo, "init", "--quiet", "-b", "main");
  await git(repo, "config", "user.email", "test@referee.local");
  await git(repo, "config", "user.name", "Referee Test");
  await Bun.write(join(repo, "src/.keep"), "");
  await Bun.write(join(repo, "test/.keep"), "");
  await commit(
    {
      "referee.json": JSON.stringify({
        test: ["bun", "test"],
        scope: ["src/", "test/"],
        timeoutMs: 5_000,
        sandbox: false,
        ...config,
      }),
      "src/double.ts": BUGGY,
      "test/double.test.ts": BASE_TEST,
      "README.md": "# fixture\n",
    },
    "base",
  );
  await branch(BEHIND, BRANCHES.fix);
  await commit({ "src/.keep": "main moved on\n" }, "main moves on");
  for (const [name, files] of Object.entries(BRANCHES)) await branch(name, files);
  return repo;
}
