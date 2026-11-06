import { z } from "zod";

export const ProofConfig = z.object({
  test: z.array(z.string()).min(1),
  scope: z.array(z.string().regex(/\/$/, "scope entries are folders and end with /")).min(1),
  testMatch: z.string().default("\\.(test|spec)\\.[cm]?[jt]sx?$"),
  timeoutMs: z.number().int().positive().default(120_000),
  sandbox: z.union([z.object({ image: z.string().min(1) }), z.literal(false)]),
});
export type ProofConfig = z.infer<typeof ProofConfig>;

export const CheckId = z.enum([
  "up-to-date",
  "has-regression-test",
  "in-scope",
  "fix-passes",
  "test-catches-bug",
]);
export type CheckId = z.infer<typeof CheckId>;

export const Check = z.object({
  id: CheckId,
  title: z.string(),
  passed: z.boolean(),
  detail: z.string(),
  output: z.string().optional(),
});
export type Check = z.infer<typeof Check>;

export const Verdict = z.enum(["verified", "refuted"]);
export type Verdict = z.infer<typeof Verdict>;

export const ProofReport = z.object({
  version: z.literal(1),
  repo: z.string(),
  fork: z.string().optional(),
  head: z.object({ ref: z.string(), sha: z.string() }),
  base: z.object({ ref: z.string(), sha: z.string() }),
  verdict: Verdict,
  sandboxed: z.boolean(),
  checks: z.array(Check),
  changed: z.object({
    tests: z.array(z.string()),
    source: z.array(z.string()),
    deleted: z.array(z.string()),
    outOfScope: z.array(z.string()),
  }),
  durationMs: z.number(),
  digest: z.string(),
});
export type ProofReport = z.infer<typeof ProofReport>;
