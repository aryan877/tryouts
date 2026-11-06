#!/usr/bin/env bun
import { rm } from "node:fs/promises";
import { chatPlan } from "./chat";
import { DEMO, ISSUES, MATTERMOST_URL, PEOPLE, ROOMS, TRYOUTS_CONFIG } from "./config";
import { stop } from "./controllers";
import { e2e } from "./e2e";
import { infraDown, infraUp } from "./infra";
import { retireRooms, seed } from "./seed";
import { loadState } from "./state";

const commands: Record<string, () => Promise<void>> = {
  async up() {
    await infraUp();
    await seed();
    const { passwords } = await loadState();
    const plan = chatPlan();
    console.log(`
\x1b[32m✔ Tryouts is up\x1b[0m

  Rooms              #${ROOMS.hiring} on ${plan.lead.displayName} (${PEOPLE.lead.name}), #${ROOMS.bugs} on ${plan.community.displayName} (${PEOPLE.community.name})
  Mattermost         ${MATTERMOST_URL.replace("127.0.0.1", "localhost")}
    ${PEOPLE.lead.chat} / ${passwords.lead}   (${PEOPLE.lead.role})
    ${PEOPLE.community.chat} / ${passwords.community}   (${PEOPLE.community.role})
  Post a job         @hiring we need a bug fixer. Hold a tryout on #12 with Claude Code, Codex and OpenCode.
  Full run           bun run e2e
`);
  },
  async down() {
    await stop();
    await infraDown(false);
  },
  async reset() {
    await retireRooms();
    await stop();
    await infraDown(true);
    await rm(DEMO, { recursive: true, force: true });
  },
  e2e,
  async record() {
    process.env.TRYOUTS_CONFIG = TRYOUTS_CONFIG;
    const { record } = await import("./record");
    const issue = Number(process.argv[3] ?? ISSUES.tryout.number);
    const result = await record(issue);
    console.log(
      `\x1b[32m✔ Recorded tryout #${issue}\x1b[0m: ${result.candidates.length} candidates, ${result.feed.length} messages`,
    );
  },
};

const command = commands[process.argv[2] ?? ""];
if (!command) {
  console.error(`Usage: tryouts-demo <${Object.keys(commands).join("|")}>`);
  process.exit(2);
}
await command().catch((error: unknown) => {
  console.error(`\x1b[31m✘ ${error instanceof Error ? error.message : String(error)}\x1b[0m`);
  process.exit(1);
});
