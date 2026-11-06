import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { INFRA, type PersonKey, STATE_FILE } from "./config";

export interface State {
  passwords: Record<PersonKey, string>;
}

export async function loadState(): Promise<State> {
  const file = Bun.file(STATE_FILE);
  if (await file.exists()) return (await file.json()) as State;
  const fresh = () => `Tr-${randomBytes(12).toString("hex")}`;
  const state: State = { passwords: { lead: fresh(), community: fresh() } };
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await Bun.write(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

export async function infraEnv(): Promise<Record<string, string>> {
  const text = await Bun.file(join(INFRA, ".env")).text();
  return Object.fromEntries(
    text
      .split("\n")
      .filter((line) => line.includes("=") && !line.startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}
