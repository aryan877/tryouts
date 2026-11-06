import type { TryoutRecord } from "@tryouts/kit/record";
import { endOf } from "./board";
import { ms } from "./format";

interface Segment {
  from: number;
  to: number;
  realFrom: number;
  realTo: number;
}

export interface Plan {
  duration: number;
  speed: number;
  lightsOutStart: number;
  lightsOutEnd: number;
  real(t: number): number;
  lightsOut(t: number): number | null;
  points: number[];
}

const LIGHTS_FROM = 800;
const LIGHT_STEP = 300;
const LIGHTS_OFF = 2400;
const RACE_END = 7000;
const REFEREE_END = 9000;
const ANSWER = 9700;
const HOLD_END = 12200;
const DURATION = 14000;

export function planOf(record: TryoutRecord): Plan {
  const started = ms(record.startedAt);
  const created = record.candidates.map((c) => ms(c.createdAt));
  const firstCreated = Math.min(started, ...created);
  const lastCreated = Math.min(started, Math.max(...created));
  const race = Math.max(
    started + 1,
    ...record.candidates.map((c) => (c.readyAt ? ms(c.readyAt) : 0)),
  );
  const judged = Math.max(
    race,
    ...record.feed
      .filter((item) => item.kind === "referee" && ms(item.at) >= started)
      .map((item) => ms(item.at))
      .filter((at) => !record.hire || at <= ms(record.hire.approval.askedAt)),
  );
  const asked = record.hire ? ms(record.hire.approval.askedAt) : judged;
  const answered = record.hire ? ms(record.hire.approval.answeredAt ?? record.hire.at) : judged;
  const end = Math.max(answered, endOf(record));
  const segments: Segment[] = [
    { from: 0, to: LIGHTS_FROM, realFrom: firstCreated - 1, realTo: lastCreated },
    { from: LIGHTS_FROM, to: LIGHTS_OFF, realFrom: started - 1, realTo: started - 1 },
    { from: LIGHTS_OFF, to: RACE_END, realFrom: started, realTo: race },
    { from: RACE_END, to: REFEREE_END, realFrom: race, realTo: judged },
    { from: REFEREE_END, to: ANSWER, realFrom: asked, realTo: answered },
    { from: ANSWER, to: HOLD_END, realFrom: answered, realTo: answered },
    { from: HOLD_END, to: DURATION, realFrom: answered, realTo: end },
  ];
  const real = (t: number) => {
    const segment = segments.find((s) => t < s.to) ?? (segments.at(-1) as Segment);
    const progress = Math.min(1, Math.max(0, (t - segment.from) / (segment.to - segment.from)));
    return segment.realFrom + (segment.realTo - segment.realFrom) * progress;
  };
  const points = [
    ...new Set([
      ...created,
      started,
      ...record.feed.map((item) => ms(item.at)),
      ...record.candidates.flatMap((c) =>
        c.readyAt ? [ms(c.readyAt), ms(c.readyAt) + (c.report?.durationMs ?? 0)] : [],
      ),
      race,
      ...record.deletions.map((d) => ms(d.at)),
      ...record.probation.fixes.map((fix) => ms(fix.at)),
      asked,
      answered,
      end,
    ]),
  ].sort((a, b) => a - b);
  return {
    duration: DURATION,
    speed: Math.max(1, Math.round((race - started) / (RACE_END - LIGHTS_OFF))),
    lightsOutStart: LIGHTS_FROM,
    lightsOutEnd: LIGHTS_OFF,
    real,
    lightsOut: (t) =>
      t >= LIGHTS_FROM && t < LIGHTS_OFF
        ? Math.min(5, Math.floor((t - LIGHTS_FROM) / LIGHT_STEP) + 1)
        : null,
    points,
  };
}

export function step(points: number[], at: number): number {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((points[mid] as number) <= at) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
