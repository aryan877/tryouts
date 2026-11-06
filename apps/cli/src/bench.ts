import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { branchOf, parseCandidate, type Vendor } from "@tryouts/kit";
import { git, type ProofReport, verify } from "@tryouts/referee";
import { type Config, STATE_DIR } from "./config";

export interface Slot {
  agent: string;
  vendor: Vendor;
  tryout: number;
  issue: number;
  branch: string;
  fork: string;
}

export interface Checked {
  report: ProofReport;
  checkedAt: string;
}

export function slotOf(config: Config, agent: string, issue: number): Slot {
  const candidate = parseCandidate(agent);
  if (!candidate) throw new Error(`"${agent}" is not a candidate name like codex-12.`);
  return {
    agent,
    vendor: candidate.vendor,
    tryout: candidate.issue,
    issue,
    branch: candidate.issue === issue ? branchOf(agent) : `fix/${issue}`,
    fork: join(config.bench, candidate.vendor, `issue-${issue}`),
  };
}

const reportFile = (slot: Slot) => join(STATE_DIR, "reports", `${slot.agent}-${slot.issue}.json`);

export async function history(slot: Slot): Promise<Checked[]> {
  const file = Bun.file(reportFile(slot));
  return (await file.exists()) ? ((await file.json()) as Checked[]) : [];
}

export async function headOf(slot: Slot): Promise<string | null> {
  if (!(await Bun.file(join(slot.fork, ".git/HEAD")).exists())) return null;
  return git(slot.fork, "rev-parse", "--verify", "--quiet", `refs/heads/${slot.branch}`).catch(
    () => null,
  );
}

export async function commitTime(slot: Slot, sha: string): Promise<Date> {
  return new Date(Number(await git(slot.fork, "show", "-s", "--format=%ct", sha)) * 1000);
}

export async function check(config: Config, slot: Slot): Promise<Checked> {
  const report = await verify({ repo: config.repository, head: slot.branch, fork: slot.fork });
  const checked = { report, checkedAt: new Date().toISOString() };
  const past = await history(slot);
  await mkdir(join(STATE_DIR, "reports"), { recursive: true });
  await Bun.write(reportFile(slot), `${JSON.stringify([...past, checked], null, 2)}\n`);
  return checked;
}

export async function latest(config: Config, slot: Slot): Promise<Checked | null> {
  const head = await headOf(slot);
  if (!head) return null;
  const known = (await history(slot)).findLast(
    (c) => c.report.head.sha === head && c.report.repo === config.repository,
  );
  return known ?? check(config, slot);
}
