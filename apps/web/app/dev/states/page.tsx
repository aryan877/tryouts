import type { TryoutRecord } from "@tryouts/kit/record";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/tryouts/agent-card";
import { ApprovalCard } from "@/components/tryouts/approval-card";
import { Bib } from "@/components/tryouts/bib";
import { BudgetMeter } from "@/components/tryouts/budget-meter";
import { CheckLights } from "@/components/tryouts/check-lights";
import { CostTicker } from "@/components/tryouts/cost-ticker";
import { HiredStamp } from "@/components/tryouts/hired-stamp";
import { OnTheClockBand } from "@/components/tryouts/on-the-clock-band";
import { PhaseRail } from "@/components/tryouts/phase-rail";
import { ProbationTracker } from "@/components/tryouts/probation-tracker";
import { RunTree } from "@/components/tryouts/run-tree";
import { StatusChip } from "@/components/tryouts/status-chip";
import { Tower } from "@/components/tryouts/tower";
import {
  CHIP,
  frameAt,
  type LaneStatus,
  type LightState,
  PHASES,
  recommendationOf,
} from "@/lib/board";
import { FIXTURE } from "@/lib/fixture";
import { ms } from "@/lib/format";

export const metadata: Metadata = { title: "States", robots: { index: false } };

const at = (time: string) => ms(`2026-11-05T${time}Z`);

const MOMENTS = [
  { label: "Drawn: created by hiring, before the start", time: "15:44:03" },
  { label: "Race: everyone working", time: "15:48:00" },
  { label: "Referee: one verified, one checking", time: "15:51:20" },
  { label: "All judged, before the pick", time: "15:53:20" },
  { label: "Owner's pick: on the clock", time: "15:53:40" },
  { label: "Hired: the losers are dismissing", time: "15:54:00" },
  { label: "Final", time: "16:08:10" },
];

const OVER_BUDGET: TryoutRecord = {
  ...FIXTURE,
  hire: null,
  candidates: FIXTURE.candidates.map((c) =>
    c.agent === "opencode-12"
      ? {
          ...c,
          report: null,
          readyAt: null,
          seconds: null,
          budget: { limit: 60_000, spent: 60_000, exhausted: true },
        }
      : c,
  ),
};

const LIGHTS: { label: string; lights: LightState[]; lightsOut?: number }[] = [
  { label: "Off", lights: ["off", "off", "off", "off", "off"] },
  {
    label: "Checking (scanner)",
    lights: ["checking", "checking", "checking", "checking", "checking"],
  },
  { label: "Verified", lights: ["pass", "pass", "pass", "pass", "pass"] },
  { label: "Refuted", lights: ["pass", "pass", "pass", "pass", "fail"] },
  { label: "Lights out, 3 of 5", lights: ["off", "off", "off", "off", "off"], lightsOut: 3 },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="caps text-ink-3">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function StatesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const hire = FIXTURE.hire;
  if (!hire) return null;
  const finalFrame = frameAt(FIXTURE, at("16:08:10"));
  return (
    <div className="container-page py-10">
      <h1 className="h1">States</h1>
      <p className="mt-2 text-ink-2">
        Development only. Sample data from <code className="mono">lib/fixture.ts</code>. Use the
        header toggle for the other theme.
      </p>

      <Block title="Status chip">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(CHIP) as LaneStatus[]).map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
      </Block>

      <Block title="Bibs">
        <div className="flex flex-wrap items-end gap-4">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="flex items-end gap-2">
              <Bib n={n} size={24} />
              <Bib n={n} size={32} />
              <Bib n={n} size={48} />
            </span>
          ))}
        </div>
      </Block>

      <Block title="Check lights">
        <div className="flex flex-wrap items-center gap-6">
          {LIGHTS.map((item) => (
            <div key={item.label} className="flex flex-col items-start gap-2">
              <CheckLights lights={item.lights} lightsOut={item.lightsOut ?? null} />
              <span className="text-[12px] text-ink-3">{item.label}</span>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            {([12, 16, 20, 28] as const).map((size) => (
              <CheckLights
                key={size}
                lights={["pass", "pass", "fail", "pass", "pass"]}
                size={size}
              />
            ))}
          </div>
          <CheckLights lights={["pass", "pass", "pass", "pass", "pass"]} labels />
        </div>
      </Block>

      <Block title="Budget meter and cost">
        <div className="grid max-w-3xl gap-6 sm:grid-cols-4">
          <BudgetMeter budget={null} />
          <BudgetMeter budget={{ limit: 60_000, spent: 21_400, exhausted: false }} />
          <BudgetMeter budget={{ limit: 60_000, spent: 51_300, exhausted: false }} />
          <BudgetMeter budget={{ limit: 60_000, spent: 60_000, exhausted: true }} />
        </div>
        <div className="mt-6 flex gap-8 text-[17px] font-[650]">
          <CostTicker value={null} asOf={FIXTURE.prices.asOf} />
          <CostTicker value={0.004} asOf={FIXTURE.prices.asOf} />
          <CostTicker value={0.409875} asOf={FIXTURE.prices.asOf} />
        </div>
      </Block>

      <Block title="Hired stamp">
        <div className="flex flex-wrap items-center gap-10">
          {(["lane", "card", "hero"] as const).map((size) => (
            <HiredStamp
              key={size}
              role={FIXTURE.role}
              date={hire.at}
              approver="Arjun"
              app="slack"
              size={size}
              className="-rotate-3"
            />
          ))}
        </div>
      </Block>

      <Block title="Phase rail">
        <div className="screen flex flex-wrap gap-6 rounded-panel p-4">
          {PHASES.map((phase) => (
            <PhaseRail key={phase.id} phase={phase.id} probation={{ done: 0, of: 3 }} />
          ))}
          <PhaseRail phase="probation" probation={{ done: 1, of: 3 }} />
        </div>
      </Block>

      <Block title="On the clock band">
        <OnTheClockBand
          approval="open"
          owner="Arjun"
          app="slack"
          room="hiring"
          askedAt={ms(hire.approval.askedAt)}
          at={at("15:53:46")}
        />
      </Block>

      <Block title="Approval card">
        <div className="grid gap-6 lg:grid-cols-2">
          <ApprovalCard
            approval={{ ...hire.approval, answer: null, answeredBy: null, answeredAt: null }}
            agent="hiring"
            owner="Arjun"
            state="open"
            app="slack"
            at={at("15:53:46")}
            recommendation={recommendationOf(FIXTURE)}
          />
          <ApprovalCard
            approval={{ ...hire.approval, answer: null, answeredBy: null, answeredAt: null }}
            agent="hiring"
            owner="Arjun"
            state="open"
            app="slack"
            at={at("15:53:46")}
            refused="Switch refused Riya. Only Arjun can answer."
          />
          <ApprovalCard
            approval={hire.approval}
            agent="hiring"
            owner="Arjun"
            state="answered"
            app="slack"
            at={at("16:00:00")}
          />
          <ApprovalCard
            approval={{ ...hire.approval, answer: "Reject" }}
            agent="hiring"
            owner="Arjun"
            state="answered"
            app="slack"
            at={at("16:00:00")}
          />
          <ApprovalCard
            approval={{ ...hire.approval, answer: null, answeredBy: null, answeredAt: null }}
            agent="hiring"
            owner="Arjun"
            state="closed"
            app="slack"
            at={at("16:00:00")}
          />
        </div>
      </Block>

      {MOMENTS.map((moment) => (
        <Block key={moment.time} title={`Tower · ${moment.label}`}>
          <Tower frame={frameAt(FIXTURE, at(moment.time))} record={FIXTURE} />
        </Block>
      ))}
      <Block title="Tower · over budget, no hire">
        <Tower frame={frameAt(OVER_BUDGET, at("16:08:10"))} record={OVER_BUDGET} />
      </Block>
      <Block title="Tower · lights out">
        <Tower frame={frameAt(FIXTURE, at("15:44:03"))} record={FIXTURE} lightsOut={3} />
      </Block>

      <Block title="Run tree">
        <div className="grid gap-6 lg:grid-cols-2">
          <RunTree record={FIXTURE} frame={frameAt(FIXTURE, at("15:44:02"))} />
          <RunTree record={FIXTURE} frame={finalFrame} />
        </div>
      </Block>

      <Block title="Agent cards">
        <div className="flex flex-wrap gap-6">
          {FIXTURE.candidates.map((c) => (
            <AgentCard key={c.agent} record={FIXTURE} candidate={c} size="md" />
          ))}
          {OVER_BUDGET.candidates
            .filter((c) => c.budget?.exhausted)
            .map((c) => (
              <AgentCard key={c.agent} record={OVER_BUDGET} candidate={c} size="md" />
            ))}
        </div>
      </Block>

      <Block title="Probation">
        <div className="flex flex-col gap-6">
          <ProbationTracker record={{ ...FIXTURE, probation: { of: 3, fixes: [] } }} />
          <ProbationTracker record={FIXTURE} />
          <ProbationTracker
            record={{
              ...FIXTURE,
              probation: {
                of: 3,
                fixes: [13, 14, 15, 16].map((issue, i) => ({
                  ...(FIXTURE.probation.fixes[0] as TryoutRecord["probation"]["fixes"][number]),
                  issue,
                  at: `2026-11-0${5 + i}T16:07:55.000Z`,
                })),
              },
            }}
          />
        </div>
      </Block>
    </div>
  );
}
