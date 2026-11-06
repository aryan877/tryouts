import { rm } from "node:fs/promises";
import { join } from "node:path";
import { Gateway, Mattermost } from "@tryouts/switch";
import { INFRA, MATTERMOST_URL, SWITCH_URL } from "./config";
import { sh, step, waitFor } from "./shell";
import { infraEnv } from "./state";

const ENV_FILE = join(INFRA, ".env");

const compose = async (...args: string[]) =>
  sh(
    [
      "docker",
      "compose",
      ...((await Bun.file(ENV_FILE).exists()) ? ["--env-file", ENV_FILE] : []),
      ...args,
    ],
    INFRA,
  );

export async function infraUp(): Promise<void> {
  if (!(await Bun.file(ENV_FILE).exists())) {
    await sh(["bash", join(INFRA, "init-env.sh")], INFRA);
  }
  step("Starting Switch, Postgres and Mattermost (Docker)");
  await compose("up", "-d");
  const env = await infraEnv();
  await waitFor(
    "Switch and its Mattermost bridge",
    async () => {
      const gateway = await Gateway.login(
        SWITCH_URL,
        env.GATEWAY_ADMIN_EMAIL as string,
        env.GATEWAY_ADMIN_PASSWORD as string,
      );
      return (await gateway.bridges()).some((bridge) => bridge.bridge_type === "mattermost");
    },
    300_000,
    3_000,
  );
}

export async function infraDown(volumes: boolean): Promise<void> {
  await compose("down", ...(volumes ? ["-v"] : []));
  if (volumes) await rm(ENV_FILE, { force: true });
}

export async function admins() {
  const env = await infraEnv();
  const gateway = await Gateway.login(
    SWITCH_URL,
    env.GATEWAY_ADMIN_EMAIL as string,
    env.GATEWAY_ADMIN_PASSWORD as string,
  );
  const mattermost = await Mattermost.login(
    MATTERMOST_URL,
    env.MATTERMOST_ADMIN_USER as string,
    env.MATTERMOST_ADMIN_PASSWORD as string,
  );
  return { gateway, mattermost, team: env.MATTERMOST_TEAM_NAME as string };
}
