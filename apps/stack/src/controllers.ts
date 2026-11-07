import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Gateway } from "@tryouts/switch";
import {
  ARJUN,
  BIN_DIR,
  CONTROLLER_BIN,
  CONTROLLER_VERSION,
  MACHINE,
  PEOPLE,
  ROOT,
  SWITCH_URL,
} from "./config";
import { sh, step } from "./shell";

const RELEASE = `https://github.com/sandbox-quantum/switch/releases/download/switch-agent-controller-v${CONTROLLER_VERSION}/switch-agent-controller-${CONTROLLER_VERSION}.tgz`;
const DATA_DIR = join(ARJUN, "controller");
const PID_FILE = join(DATA_DIR, "run.pid");

export async function installController(): Promise<void> {
  if (await Bun.file(CONTROLLER_BIN).exists()) return;
  step(`Installing Switch agent controller ${CONTROLLER_VERSION}`);
  const tools = join(ROOT, ".tools");
  const tarball = join(tools, `switch-agent-controller-${CONTROLLER_VERSION}.tgz`);
  const response = await fetch(RELEASE);
  if (!response.ok) throw new Error(`Downloading ${RELEASE} failed: ${response.status}`);
  await Bun.write(tarball, response);
  await sh(
    [
      "npm",
      "install",
      "--prefix",
      "controller",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarball,
    ],
    tools,
  );
}

export async function enroll(gateway: Gateway): Promise<void> {
  if (await Bun.file(join(DATA_DIR, "controller.db")).exists()) return;
  step(`Enrolling ${PEOPLE.lead.name}'s machine (${MACHINE})`);
  await mkdir(DATA_DIR, { recursive: true });
  await sh(
    [
      CONTROLLER_BIN,
      "enroll",
      `--server=${SWITCH_URL}`,
      `--code=${await gateway.enrollmentCode()}`,
      `--name=${MACHINE}`,
      `--description=${PEOPLE.lead.name}'s laptop`,
      `--data-dir=${DATA_DIR}`,
      "--secret-store=file",
    ],
    ROOT,
  );
}

async function runningPid(): Promise<number | null> {
  const file = Bun.file(PID_FILE);
  if (!(await file.exists())) return null;
  const pid = Number(await file.text());
  const command = await sh(["ps", "-p", String(pid), "-o", "command="], ROOT).catch(() => "");
  return command.includes("switch-agent-controller") ? pid : null;
}

export async function start(): Promise<void> {
  if (await runningPid()) return;
  step(`Starting ${PEOPLE.lead.name}'s agent controller`);
  const pid = await sh(
    [
      "sh",
      "-c",
      `unset SLACK_BOT_TOKEN SLACK_APP_TOKEN DISCORD_BOT_TOKEN; nohup "$0" run --data-dir="$1" >> "$2" 2>&1 & echo $!`,
      CONTROLLER_BIN,
      DATA_DIR,
      join(dirname(DATA_DIR), "controller.log"),
    ],
    ROOT,
    {
      PATH: `${BIN_DIR}:${dirname(process.execPath)}:${process.env.PATH}`,
      OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS: "600000",
    },
  );
  await Bun.write(PID_FILE, pid);
}

export async function stop(): Promise<void> {
  const pid = await runningPid();
  if (pid) process.kill(pid, "SIGTERM");
}
