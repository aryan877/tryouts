import { randomUUID } from "node:crypto";
import { run } from "./git";
import type { ProofConfig } from "./schema";

const CONTAINER_DIR = "/work";

export function testArgv(config: ProofConfig, dir: string, name: string): string[] {
  if (config.sandbox === false) return config.test;
  return [
    "docker",
    "run",
    "--rm",
    `--name=${name}`,
    "--init",
    "--network=none",
    "--read-only",
    "--tmpfs=/tmp",
    "--env=HOME=/tmp",
    `--user=${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
    "--security-opt=no-new-privileges",
    "--cap-drop=ALL",
    "--memory=512m",
    "--pids-limit=256",
    `--volume=${dir}:${CONTAINER_DIR}`,
    `--workdir=${CONTAINER_DIR}`,
    config.sandbox.image,
    ...config.test,
  ];
}

export function runTests(config: ProofConfig, dir: string) {
  const name = `referee-${randomUUID()}`;
  return run(testArgv(config, dir, name), dir, {
    timeoutMs: config.timeoutMs,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR },
    ...(config.sandbox ? { onTimeout: () => Bun.spawn(["docker", "kill", name]) } : {}),
  });
}
