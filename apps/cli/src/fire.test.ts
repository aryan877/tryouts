import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressingRule, ApprovalRecord, Gateway } from "@tryouts/switch";

const state = await mkdtemp(join(tmpdir(), "tryouts-fire-"));
process.env.TRYOUTS_CONFIG = join(state, "config.json");
const { fire, loadRecord, probation, refutedFixes } = await import("./hire");

const FIRE = "tryouts fire --agent opencode-1 --issue 2";
const config = { rooms: { hiring: "hiring", bugs: "bugs" }, probation: 3 } as never;
const ownerRule = { users: [], agents: [], owner: true, owner_agents: true };

function desk(card: Partial<ApprovalRecord> | null) {
  const set: AddressingRule[][] = [];
  const owner = {
    me: async () => ({ id: "u-arjun", name: "Arjun", email: "a@x" }),
    agents: async () => [
      {
        id: "a-hiring",
        name: "hiring",
        owner_id: "u-arjun",
        addressing_policy: { rules: [ownerRule] },
      },
      { id: "a-hire", name: "opencode-1", owner_id: "u-arjun", addressing_policy: null },
    ],
    rooms: async () => [{ id: "r-hiring", name: "hiring" }],
    joinChat: async () => undefined,
    chatApprovals: async () => (card ? [card] : []),
    setAddressingPolicy: async (_: string, rules: AddressingRule[]) => {
      set.push(rules);
    },
  } as unknown as Gateway;
  return { accounts: { owner, admin: owner }, set };
}

const allowed = {
  requestId: "per_fire",
  agentId: "a-hiring",
  state: "answered",
  answer: "once",
  answeredBy: "user:u-arjun",
  detail: FIRE,
  title: FIRE,
  options: [{ id: "once", label: "Allow once", decision: "accept" }],
} as Partial<ApprovalRecord>;

async function hired() {
  await mkdir(join(state, "hires"), { recursive: true });
  await Bun.write(
    join(state, "hires", "opencode-1.json"),
    JSON.stringify({
      agent: "opencode-1",
      tryout: 1,
      hire: { approval: "per_hire" },
      board: [{ agent: "opencode-1" }, { agent: "codex-1", label: "Codex gpt-5.6-luna" }],
      probation: [],
    }),
  );
}

afterAll(() => rm(state, { recursive: true, force: true }));

describe("ending probation", () => {
  test("the same commit refuted twice is one strike, three commits are three", () => {
    const check = (sha: string) => ({
      checkedAt: "",
      report: { verdict: "refuted", head: { sha } },
    });
    expect(refutedFixes([check("a"), check("a")] as never)).toBe(1);
    expect(refutedFixes([check("a"), check("b"), check("c")] as never)).toBe(3);
  });

  test("without the owner's Allow once nothing changes", async () => {
    await hired();
    const { accounts, set } = desk(null);
    await expect(
      fire(config, accounts as never, { agent: "opencode-1", issue: 2 }),
    ).rejects.toThrow("Allow once");
    expect(set).toEqual([]);
    expect((await loadRecord("opencode-1"))?.status).toBeUndefined();
  });

  test("the hire loses the room, the runner-up is named, and merges are refused", async () => {
    await hired();
    const { accounts, set } = desk(allowed);
    const text = await fire(config, accounts as never, { agent: "opencode-1", issue: 2 });
    expect(set).toEqual([
      [{ rooms: "*", room_groups: "*", users: [], agents: [], owner: true, owner_agents: true }],
    ]);
    expect(text).toContain("Probation failed");
    expect(text).toContain("Runner-up in tryout #1: Codex gpt-5.6-luna");
    expect((await loadRecord("opencode-1"))?.status).toBe("failed");
    expect(
      await probation(config, accounts as never, {
        agent: "opencode-1",
        issue: 2,
        sha: "a".repeat(40),
      }),
    ).toContain("failed probation");
  });
});
