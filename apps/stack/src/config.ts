import { join, resolve } from "node:path";

export { AGENTS, ALIAS, ISSUES, MACHINE, PEOPLE, type PersonKey, ROOMS } from "@tryouts/kit";

export const ROOT = resolve(import.meta.dir, "../../..");
export const DEMO = join(ROOT, ".demo");
export const INFRA = join(ROOT, "infra/switch");
export const TEMPLATES = join(ROOT, "templates");
export const STATE_FILE = join(DEMO, "state.json");
export const WEB_ENV = join(ROOT, "apps/web/.env.local");

export const ORIGIN = join(DEMO, "origin/tinychunk.git");
export const REPOSITORY = process.env.TRYOUTS_REPOSITORY || ORIGIN;
export const GITHUB_REPO =
  /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/.exec(REPOSITORY)?.[1] ?? null;
export const MIRROR = join(DEMO, "mirror/tinychunk.git");
export const ARJUN = join(DEMO, "arjun");
export const BIN_DIR = join(ARJUN, "bin");
export const TRYOUTS_CONFIG = join(ARJUN, "tryouts/config.json");

export const SWITCH_URL = "http://127.0.0.1:8000";
export const MATTERMOST_URL = "http://127.0.0.1:8065";

export const CONTROLLER_VERSION = "0.31.0";
export const CONTROLLER_BIN = join(
  ROOT,
  ".tools/controller/node_modules/.bin/switch-agent-controller",
);

export const MODEL = process.env.TRYOUTS_MODEL ?? "opencode-go/claude-haiku-5-5";
