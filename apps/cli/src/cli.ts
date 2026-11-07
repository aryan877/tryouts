#!/usr/bin/env bun
import { homedir } from "node:os";
import { renderCard, verify } from "@tryouts/referee";
import { parseFlags } from "./args";
import { check, history, pending, slotOf } from "./bench";
import { candidatesOf, collect, fixStat, rank, renderBoard, suggested, uncounted } from "./board";
import { loadConfig, signIn } from "./config";
import { budget, fire, hire, hireOf, probation, refutedFixes, reviewFix } from "./hire";
import { nextSteps } from "./next";
import { openReview, renderFix } from "./review";

const USAGE = `tryouts verify --agent <name> --issue <n>
tryouts verify --repo <repository> --head <branch> [--fork <folder>] [--base <commit>]
tryouts board --issue <n>
tryouts budget --issue <n>
tryouts hire --agent <name> --issue <n> --sha <40-character commit>
tryouts merge --agent <name> --issue <n> --sha <40-character commit>
tryouts fire --agent <name> --issue <n>`;

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
      const known = (await history(slot)).at(-1);
      const { report } = await check(config, slot);
      if (known?.report.digest === report.digest) {
        return {
          text: `${slot.agent} on #${slot.issue}: already on record as ${report.verdict.toUpperCase()}, commit ${report.head.sha}, digest ${report.digest}. Do nothing else.`,
          ok: report.verdict === "verified",
        };
      }
      const onProbation = slot.issue !== slot.tryout;
      const fix =
        onProbation && report.verdict === "verified" ? await reviewFix(config, slot, report) : null;
      const strikes = onProbation ? refutedFixes(await history(slot)) : 0;
      const { owner } = await signIn(config);
      const waiting = await pending(
        config,
        candidatesOf(await owner.agents(), slot.tryout),
        slot.tryout,
      );
      return {
        text: [renderCard(report), fix, nextSteps(slot, report, waiting, strikes)]
          .filter(Boolean)
          .join("\n\n"),
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
      const entries = await collect(config, await signIn(config), Number(issue), 90_000);
      const settled = uncounted(entries).length === 0;
      const commits = rank(entries)
        .filter((entry) => entry.verdict === "verified")
        .map((entry) => `${entry.agent} \`${entry.sha}\``);
      const close = settled
        ? [
            ...(commits.length > 0 ? [`Commits: ${commits.join(" · ")}`] : []),
            `@hiring the scoreboard for #${issue} is in.`,
          ].join("\n")
        : `Next: run \`tryouts board --issue ${issue}\` again in a minute.`;
      const pick = suggested(rank(entries));
      const stat = pick ? await fixStat(Number(issue), pick.agent) : null;
      const url =
        pick?.sha && stat
          ? await openReview(
              config,
              slotOf(config, pick.agent, Number(issue)),
              pick.sha,
              `Tryout #${issue}: ${pick.label}'s fix`,
              `The suggested hire from tryout #${issue}. It merges only after the owner's Allow once in Switch.`,
            )
          : null;
      const fix = pick && stat ? renderFix(pick.agent, stat, url) : null;
      return {
        text: [renderBoard(Number(issue), entries), fix, close].filter(Boolean).join("\n\n"),
        ok: true,
      };
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
    case "fire": {
      const flags = parseFlags(argv, ["agent", "issue"]);
      const config = await loadConfig();
      const text = await fire(config, await signIn(config), {
        agent: flags.agent,
        issue: Number(flags.issue),
      });
      return { text, ok: !text.startsWith("**Not") };
    }
    default:
      return { text: USAGE, ok: command === "help" || command === "--help" };
  }
}

const [command, ...rest] = process.argv.slice(2);
try {
  const { text, ok } = await main([command as string, ...rest]);
  console.log(text);
  process.exit(ok ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(command === "board" ? `@hiring the scoreboard failed: ${message}` : message);
  process.exit(2);
}
