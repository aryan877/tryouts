import { expect, test } from "bun:test";
import { parseApprovalPost } from "./mattermost";

test("reads an open approval card", () => {
  const message =
    "@arjun **Permission needed** · request `A1`\ntryouts hire --agent codex-12 --issue 12 --sha 4be1c0de\nReply with `A1` and your choice, e.g. `A1 1`.";
  expect(parseApprovalPost(message)).toEqual({
    request: "A1",
    command: "tryouts hire --agent codex-12 --issue 12 --sha 4be1c0de",
    answer: null,
    answeredBy: null,
  });
});

test("reads who answered an approval card", () => {
  const message =
    "**Allow once** · request `A1`\ntryouts hire --agent codex-12 --issue 12 --sha 4be1c0de\nChosen by @arjun from Mattermost.";
  expect(parseApprovalPost(message)).toEqual({
    request: "A1",
    command: "tryouts hire --agent codex-12 --issue 12 --sha 4be1c0de",
    answer: "Allow once",
    answeredBy: "arjun",
  });
});

test("reads a card whose command sits under a title line", () => {
  const message =
    "**Deny** · request `A2`\nls -la\n`ls -la; which tryouts`\nChosen by @arjun from Mattermost.";
  expect(parseApprovalPost(message)).toMatchObject({
    command: "ls -la\n`ls -la; which tryouts`",
    answer: "Deny",
    answeredBy: "arjun",
  });
});

test("ignores ordinary messages", () => {
  expect(parseApprovalPost("Merged `c5fe699` into `main`.")).toBeNull();
});
