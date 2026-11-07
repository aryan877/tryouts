import { chmod, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { VENDORS } from "@tryouts/kit";
import { type Gateway, HttpError } from "@tryouts/switch";
import { ROOT, TEMPLATES } from "./config";

export const TEMPLATE = {
  tryout: {
    name: "tryout",
    file: "tryout.yaml",
    kind: "group",
    description: "One tryout: a candidate agent and a private room per vendor",
  },
  team: {
    name: "tryouts-team",
    file: "tryouts-team.yaml",
    kind: "group",
    description: "The hiring manager, the referee and #hiring for one repository",
  },
  bugs: {
    name: "bugs-room",
    file: "bugs-room.yaml",
    kind: "room",
    description: "The community's public bugs room",
  },
} as const;

type Template = (typeof TEMPLATE)[keyof typeof TEMPLATE];

export interface Folders {
  hiring: string;
  referee: string;
  bench: string;
}

const locked = (bash: Record<string, "allow" | "ask" | "deny">) => ({
  $schema: "https://opencode.ai/config.json",
  permission: {
    bash: { "*": "deny", ...bash },
    edit: "deny",
    webfetch: "deny",
    websearch: "deny",
    external_directory: "deny",
  },
  experimental: { continue_loop_on_deny: true },
});

const NO_PUSH = {
  opencode: {
    $schema: "https://opencode.ai/config.json",
    permission: { bash: { "git push*": "deny", "gh *": "deny" } },
  },
  claude: { permissions: { deny: ["Bash(git push:*)", "Bash(gh:*)"] } },
};

export async function prepareFolders(root: string): Promise<Folders> {
  const folders = {
    hiring: join(root, "hiring"),
    referee: join(root, "referee"),
    bench: join(root, "bench"),
  };
  const configs: [string, ReturnType<typeof locked>][] = [
    [
      folders.hiring,
      locked({ "tryouts hire *": "ask", "tryouts merge *": "ask", "tryouts fire *": "ask" }),
    ],
    [
      folders.referee,
      locked({
        "tryouts verify --agent * --issue *": "allow",
        "tryouts board --issue *": "allow",
        "tryouts budget --issue *": "allow",
      }),
    ],
  ];
  for (const [folder, config] of configs) {
    await mkdir(folder, { recursive: true });
    await Bun.write(join(folder, "opencode.json"), `${JSON.stringify(config, null, 2)}\n`);
  }
  for (const vendor of Object.keys(VENDORS)) {
    await mkdir(join(folders.bench, vendor), { recursive: true });
  }
  for (const vendor of ["opencode", "opencode2"]) {
    await Bun.write(
      join(folders.bench, vendor, "opencode.json"),
      `${JSON.stringify(NO_PUSH.opencode, null, 2)}\n`,
    );
  }
  await mkdir(join(folders.bench, "claude", ".claude"), { recursive: true });
  await Bun.write(
    join(folders.bench, "claude", ".claude", "settings.json"),
    `${JSON.stringify(NO_PUSH.claude, null, 2)}\n`,
  );
  return folders;
}

export async function installLauncher(launcher: string, config?: string): Promise<void> {
  await mkdir(dirname(launcher), { recursive: true });
  const env = config ? `TRYOUTS_CONFIG="${config}" ` : "";
  await Bun.write(
    launcher,
    `#!/bin/sh\n${env}exec "${process.execPath}" "${join(ROOT, "apps/cli/src/cli.ts")}" "$@"\n`,
  );
  await chmod(launcher, 0o755);
}

export async function writeConfig(path: string, config: object): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(config, null, 2)}\n`);
  await chmod(path, 0o600);
}

export async function saveTemplate(gateway: Gateway, template: Template): Promise<string> {
  const content = await Bun.file(join(TEMPLATES, template.file)).text();
  const { name, description, kind } = template;
  try {
    await gateway.saveTemplate({ name, description, kind, content });
  } catch (error) {
    if (!(error instanceof HttpError && error.status === 409)) throw error;
    const saved = (await gateway.templates(name)).find((t) => t.name === name);
    if (saved) await gateway.updateTemplate(saved.id, content);
  }
  return content;
}

export async function runOnce(
  gateway: Gateway,
  template: Template,
  done: () => Promise<boolean>,
  inputs: Record<string, unknown>,
): Promise<void> {
  const content = await saveTemplate(gateway, template);
  if (await done()) return;
  await gateway.runTemplate(content, inputs, template.name);
}
