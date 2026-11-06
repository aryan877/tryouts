import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { Gateway } from "@tryouts/switch";

export interface Price {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface Config {
  switch: { url: string; email: string; password: string };
  admin?: { email: string; password: string };
  repository: string;
  bench: string;
  rooms: { hiring: string; bugs: string };
  budget: { outputTokens: number; periodHours: number };
  probation: number;
  prices: Record<string, Price>;
}

export const CONFIG_PATH = process.env.TRYOUTS_CONFIG ?? join(homedir(), ".tryouts/config.json");
export const STATE_DIR = dirname(CONFIG_PATH);

export const PRICES_AS_OF = "2026-11-06";

export const DEFAULT_PRICES: Record<string, Price> = {
  claude: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  codex: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 },
  opencode: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0 },
};

export async function loadConfig(): Promise<Config> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) {
    throw new Error(
      `No tryouts config at ${CONFIG_PATH}. Run \`bun run setup <repository>\` first.`,
    );
  }
  const config = (await file.json()) as Partial<Config>;
  return {
    rooms: { hiring: "hiring", bugs: "bugs" },
    budget: { outputTokens: 60_000, periodHours: 24 },
    probation: 3,
    ...config,
    prices: { ...DEFAULT_PRICES, ...config.prices },
  } as Config;
}

export const repoName = (repository: string) => basename(repository).replace(/\.git$/, "");

export interface Accounts {
  owner: Gateway;
  admin: Gateway;
}

export async function signIn(config: Config): Promise<Accounts> {
  const { url, email, password } = config.switch;
  const owner = await Gateway.login(url, email, password);
  const admin = config.admin
    ? await Gateway.login(url, config.admin.email, config.admin.password)
    : owner;
  return { owner, admin };
}
