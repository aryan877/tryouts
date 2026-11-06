import { expect, test } from "bun:test";
import { parseFlags } from "./args";

test("accepts the referee's exact command", () => {
  expect(parseFlags(["--agent", "codex-12", "--issue", "12"], ["agent", "issue"])).toEqual({
    agent: "codex-12",
    issue: "12",
  });
});

test.each([
  [["--agent", "codex-12;", "--issue", "12"], "--agent needs a valid value"],
  [["--agent", "codex-12", "--issue", "12", "--sha", "abc"], "Unknown option --sha"],
  [["--agent", "codex-12"], "Missing --issue"],
  [["--issue", "1", "--issue", "2", "--agent", "x"], "--issue is given twice"],
])("refuses %p", (argv, message) => {
  expect(() => parseFlags(argv, ["agent", "issue"])).toThrow(message);
});
