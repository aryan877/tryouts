#!/usr/bin/env bun
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { CONFIG_PATH } from "@tryouts/cli/config";
import { installLauncher, prepareFolders, TEMPLATE, writeConfig } from "./install";

const repository = Bun.argv[2];
const { SWITCH_URL, SWITCH_EMAIL, SWITCH_PASSWORD, SWITCH_ADMIN_EMAIL, SWITCH_ADMIN_PASSWORD } =
  process.env;
if (!repository || !SWITCH_URL || !SWITCH_EMAIL || !SWITCH_PASSWORD) {
  console.error(`Usage: SWITCH_URL=… SWITCH_EMAIL=… SWITCH_PASSWORD=… bun run setup <repository clone URL>

Installs the \`tryouts\` command, prepares the hiring manager's, the referee's and the bench
folders, and writes ${CONFIG_PATH}. SWITCH_EMAIL is the team lead who owns the agents. Set
SWITCH_ADMIN_EMAIL and SWITCH_ADMIN_PASSWORD to a workspace admin, which reads usage and sets
budgets; keep the team lead a plain member, or Switch lets the hiring manager into every room.`);
  process.exit(2);
}

const home = homedir();
const root = join(home, ".tryouts", basename(repository).replace(/\.git$/, ""));
const launcher = join(home, ".bun/bin/tryouts");
await installLauncher(launcher);
const folders = await prepareFolders(root);
await writeConfig(CONFIG_PATH, {
  switch: { url: SWITCH_URL, email: SWITCH_EMAIL, password: SWITCH_PASSWORD },
  ...(SWITCH_ADMIN_EMAIL && SWITCH_ADMIN_PASSWORD
    ? { admin: { email: SWITCH_ADMIN_EMAIL, password: SWITCH_ADMIN_PASSWORD } }
    : {}),
  repository,
  bench: folders.bench,
  rooms: { hiring: "hiring", bugs: "bugs" },
});
const tilde = (path: string) => path.replace(home, "~");

console.log(`
\x1b[32m✔ Ready on this machine\x1b[0m

  tryouts                ${tilde(launcher)}
  Config                 ${tilde(CONFIG_PATH)}
  Hiring manager folder  ${folders.hiring}
  Referee folder         ${folders.referee}
  Bench                  ${folders.bench}

Next, in Switch Console → Resources → Templates → Upload template → Load from file:
  1. templates/${TEMPLATE.tryout.file}
  2. templates/${TEMPLATE.bugs.file}   (run by whoever owns the community's bugs room)
  3. templates/${TEMPLATE.team.file}   → Use it with the repository, bench and two folders above
Then post in #hiring: @hiring we need a bug fixer. Hold a tryout on #<issue> with Claude Code, Codex and OpenCode.
`);
