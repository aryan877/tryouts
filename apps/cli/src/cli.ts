#!/usr/bin/env bun
import { homedir } from "node:os";
import { renderCard, verify } from "@tryouts/referee";
import { parseFlags } from "./args";
import { check, pending, slotOf } from "./bench";
import { candidatesOf, collect, renderBoard, uncounted } from "./board";
import { loadConfig, signIn } from "./config";
import { budget, hire, hireOf, probation } from "./hire";
import { nextSteps } from "./next";

const USAGE = `tryouts verify --agent <name> --issue <n>
tryouts verify --repo <repository> --head <branch> [--fork <folder>] [--base <commit>]
tryouts board --issue <n>
tryouts budget --issue <n>
tryouts hire --agent <name> --issue <n> --sha <40-character commit>
tryouts merge --agent <name> --issue <n> --sha <40-character commit>`;

const home = (path: string) => path.replace(/^~(?=\/)/, homedir());

async function main([command, ...argv]: string[]): Promise<{ text: string; ok: boolean }> {
  switch (command) {
    case "verify": {
      if (argv.includes("--repo")) {
        const flags = parseFlags(argv, ["repo", "head"], ["fork", "base"]);
        const report = await verify({
          repo: home(flags.repo),
          head: flags.head,
          ...(flags.fork ? { fork: home(flags.fork) } : {}),
          ...(flags.base ? { base: flags.base } : {}),
        });
        return { text: renderCard(report), ok: report.verdict === "verified" };
      }
      const flags = parseFlags(argv, ["agent", "issue"]);
      const config = await loadConfig();
      const slot = slotOf(config, flags.agent, Number(flags.issue));
      const closed = slot.issue === slot.tryout ? await hireOf(slot.tryout) : null;
      if (closed) {
        return {
          text: `Tryout #${slot.tryout} is closed: ${closed.agent} was hired, so ${slot.branch} is not checked again.`,
          ok: false,
        };
      }
      const { report } = await check(config, slot);
      const { owner } = await signIn(config);
      const waiting = await pending(
        config,
        candidatesOf(await owner.agents(), slot.tryout),
        slot.tryout,
      );
      return {
        text: `${renderCard(report)}\n\n${nextSteps(slot, report, waiting)}`,
        ok: report.verdict === "verified",
      };
    }
    case "board": {
      const { issue } = parseFlags(argv, ["issue"]);
      const config = await loadConfig();
      const closed = await hireOf(Number(issue));
      if (closed) {
        const board = renderBoard(Number(issue), closed.board);
        return {
          text: `${board}\nTryout #${issue} is closed: ${closed.agent} was hired.`,
          ok: true,
        };
      }
      const entries = await collect(config, await signIn(config), Number(issue), 180_000);
      const settled = uncounted(entries).length === 0;
      const close = settled
        ? `@hiring the scoreboard for #${issue} is in.`
        : `Next: run \`tryouts board --issue ${issue}\` again in a minute.`;
      return { text: `${renderBoard(Number(issue), entries)}\n\n${close}`, ok: true };
    }
    case "budget": {
      const { issue } = parseFlags(argv, ["issue"]);
      const config = await loadConfig();
      return { text: await budget(config, await signIn(config), Number(issue)), ok: true };
    }
    case "hire":
    case "merge": {
      const flags = parseFlags(argv, ["agent", "issue", "sha"]);
      const config = await loadConfig();
      const options = { agent: flags.agent, issue: Number(flags.issue), sha: flags.sha };
      const text = await (command === "hire" ? hire : probation)(
        config,
        await signIn(config),
        options,
      );
      return { text, ok: !text.startsWith("**Not") };
    }
    default:
      return { text: USAGE, ok: command === "help" || command === "--help" };
  }
}

try {
  const { text, ok } = await main(process.argv.slice(2));
  console.log(text);
  process.exit(ok ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
