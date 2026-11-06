import { describe, expect, test } from "bun:test";
import type { TryoutRecord } from "@tryouts/kit/record";
import { endOf, frameAt } from "./board";
import { FIXTURE } from "./fixture";
import { ms } from "./format";
import { planOf } from "./replay";

const at = (time: string) => ms(`2026-11-05T${time}Z`);
const agents = (record: TryoutRecord, time: number) =>
  frameAt(record, time).lanes.map((lane) => [lane.candidate.agent, lane.status]);

describe("frameAt", () => {
  test("the finished record ranks verified first, then cheapest, and dismisses the field", () => {
    const frame = frameAt(FIXTURE, endOf(FIXTURE));
    expect(frame.phase).toBe("probation");
    expect(agents(FIXTURE, endOf(FIXTURE))).toEqual([
      ["codex-12", "hired"],
      ["claude-12", "dismissed"],
      ["opencode-12", "dismissed"],
    ]);
    expect(frame.verified).toBe(2);
    expect(frame.lanes[0]?.best).toEqual({ time: true, cost: true });
  });

  test("a candidate is ready, then checking, then judged, as the referee's messages arrive", () => {
    const status = (time: string) =>
      frameAt(FIXTURE, at(time)).lanes.find((lane) => lane.candidate.agent === "codex-12")?.status;
    expect(status("15:50:00")).toBe("working");
    expect(status("15:50:45")).toBe("ready");
    expect(status("15:51:00")).toBe("checking");
    expect(status("15:51:30")).toBe("verified");
  });

  test("usage stays hidden until a candidate's turn ends, so no number is invented", () => {
    const lane = frameAt(FIXTURE, at("15:47:00")).lanes[0];
    expect(lane?.spent).toBeNull();
    expect(lane?.budget).toBeNull();
  });

  test("the approval card opens with the recommended lane and answers into the hire", () => {
    const open = frameAt(FIXTURE, at("15:53:40"));
    expect(open.phase).toBe("pick");
    expect(open.approval).toBe("open");
    expect(open.lanes[0]?.status).toBe("recommended");
    const answered = frameAt(FIXTURE, at("15:53:53"));
    expect(answered.approval).toBe("answered");
    expect(answered.hired).toBe("codex-12");
    expect(answered.lanes.slice(1).map((lane) => lane.status)).toEqual([
      "dismissing",
      "dismissing",
    ]);
  });

  test("with nobody verified there is no hire line and no best cell", () => {
    const refuted: TryoutRecord = {
      ...FIXTURE,
      hire: null,
      deletions: [],
      probation: { of: 3, fixes: [] },
      candidates: FIXTURE.candidates.map((c) =>
        c.report ? { ...c, outcome: null, report: { ...c.report, verdict: "refuted" } } : c,
      ),
    };
    const frame = frameAt(refuted, endOf(refuted));
    expect(frame.verified).toBe(0);
    expect(frame.lanes.every((lane) => !lane.best.time && !lane.best.cost)).toBe(true);
    expect(frame.lanes.map((lane) => lane.candidate.cost)).toEqual(
      [...FIXTURE.candidates.map((c) => c.cost)].sort((a, b) => a - b),
    );
  });
});

describe("planOf", () => {
  test("the replay starts before the candidates exist and ends on the finished record", () => {
    const plan = planOf(FIXTURE);
    expect(frameAt(FIXTURE, plan.real(0)).lanes).toHaveLength(0);
    expect(plan.lightsOut(plan.lightsOutStart)).toBe(1);
    expect(plan.lightsOut(plan.lightsOutEnd - 1)).toBe(5);
    expect(plan.real(plan.duration)).toBe(endOf(FIXTURE));
  });
});
