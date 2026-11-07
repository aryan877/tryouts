import { describe, expect, test } from "bun:test";
import type { AddressingRule, Agent, ApprovalRecord } from "@tryouts/switch";
import { answeredByOwner } from "./hire";

const OWNER = "u-arjun";
const ownerRule: AddressingRule = {
  users: [],
  agents: [],
  owner: true,
  owner_agents: true,
  platform: false,
};
const hiring = (rules: AddressingRule[] | null, owner = OWNER): Agent => ({
  id: "a-hiring",
  name: "hiring",
  display_name: null,
  owner_id: owner,
  owner_name: "Arjun",
  created_at: "",
  addressing_policy: rules && { rules },
});
const card = (answeredBy: string | null) =>
  ({ requestId: "r1", agentId: "a-hiring", state: "answered", answeredBy }) as ApprovalRecord;

describe("answeredByOwner", () => {
  test("an answer from the owner's Switch account counts", () => {
    expect(answeredByOwner(card(`user:${OWNER}`), OWNER, hiring([ownerRule]))).toBe(true);
  });

  test("an answer from another Switch account does not", () => {
    expect(answeredByOwner(card("user:u-riya"), OWNER, hiring([ownerRule]))).toBe(false);
  });

  test("a press in Slack counts when only the owner may address the agent", () => {
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring([ownerRule]))).toBe(true);
  });

  test("a press in Slack does not count when the agent is open to anyone", () => {
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring(null))).toBe(false);
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring([]))).toBe(false);
    const open = { ...ownerRule, users: "*" as const };
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring([ownerRule, open]))).toBe(false);
  });

  test("a press in Slack does not count when the policy names other people or the platform", () => {
    const named = { ...ownerRule, users: ["u-riya"] };
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring([named]))).toBe(false);
    const platform = { ...ownerRule, platform: true };
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring([platform]))).toBe(false);
  });

  test("a press in Slack does not count on someone else's agent", () => {
    expect(answeredByOwner(card("@slack_U1:switch"), OWNER, hiring([ownerRule], "u-riya"))).toBe(
      false,
    );
  });

  test("an unanswered card does not count", () => {
    expect(answeredByOwner(card(null), OWNER, hiring([ownerRule]))).toBe(false);
  });
});
