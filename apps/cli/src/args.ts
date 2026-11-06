const RULES = {
  agent: /^[a-z0-9][a-z0-9-]{0,62}$/,
  issue: /^[1-9]\d{0,6}$/,
  sha: /^[0-9a-f]{40}$/,
  repo: /^\S+$/,
  fork: /^\S+$/,
  head: /^\S+$/,
  base: /^\S+$/,
} as const;

export type Flag = keyof typeof RULES;

export function parseFlags<R extends Flag, O extends Flag = never>(
  argv: string[],
  required: readonly R[],
  optional: readonly O[] = [],
): Record<R, string> & Partial<Record<O, string>> {
  const allowed = new Set<string>([...required, ...optional]);
  const values: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]?.replace(/^--/, "") ?? "";
    const value = argv[i + 1];
    if (!argv[i]?.startsWith("--") || !allowed.has(flag))
      throw new Error(`Unknown option ${argv[i]}.`);
    if (value === undefined || !RULES[flag as Flag].test(value)) {
      throw new Error(`--${flag} needs a valid value, got ${value ?? "nothing"}.`);
    }
    if (flag in values) throw new Error(`--${flag} is given twice.`);
    values[flag] = value;
  }
  const missing = required.filter((flag) => !(flag in values));
  if (missing.length) throw new Error(`Missing ${missing.map((flag) => `--${flag}`).join(", ")}.`);
  return values as Record<R, string> & Partial<Record<O, string>>;
}
