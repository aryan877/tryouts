import { describe, expect, test } from "bun:test";
import { githubRepo, renderFix } from "./review";

const stat = (lines: number) => ({
  added: lines,
  removed: 1,
  files: ["src/a.ts"],
  patch: [
    "diff --git a/src/a.ts b/src/a.ts",
    "index 111..222 100644",
    ...Array.from({ length: lines }, (_, i) => `+line ${i}`),
  ].join("\n"),
});

describe("review", () => {
  test("only GitHub repositories get a pull request", () => {
    expect(githubRepo("https://github.com/acme/lib.git")).toBe("acme/lib");
    expect(githubRepo("/srv/git/lib.git")).toBeNull();
  });

  test("the approver sees the diff, cut short when it is long", () => {
    const text = renderFix("opencode-1", stat(50), "https://github.com/acme/lib/pull/3");
    expect(text).toContain("+50 −1 in src/a.ts");
    expect(text).toContain("https://github.com/acme/lib/pull/3");
    expect(text).toContain("+line 0");
    expect(text).not.toContain("+line 45");
    expect(text).toContain("10 more lines");
    expect(text).not.toContain("diff --git");
  });
});
