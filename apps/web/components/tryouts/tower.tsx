"use client";

import type { TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Crown } from "@/components/icons";
import { appOf, detailOf, type Frame, type Lane, ownerOf } from "@/lib/board";
import { diff, dollars, elapsed, ms } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bib, bibColor } from "./bib";
import { BudgetMeter } from "./budget-meter";
import { CheckLights, LightLabels } from "./check-lights";
import { CostTicker } from "./cost-ticker";
import { HiredStamp } from "./hired-stamp";
import { StatusChip } from "./status-chip";
import { Ticker } from "./ticker";
import { Tip } from "./tip";

const RESORT = { type: "spring", stiffness: 420, damping: 40 } as const;
const STAMP = { type: "spring", stiffness: 760, damping: 24, mass: 0.8, delay: 1 } as const;

const GRID =
  "lg:grid-cols-[36px_minmax(150px,1fr)_144px_172px_92px_160px_96px] lg:gap-x-3 xl:grid-cols-[48px_minmax(180px,1fr)_176px_176px_104px_88px_180px_104px] xl:gap-x-4";

const HEADERS = [
  { label: "Pos", className: "" },
  { label: "Candidate", className: "" },
  { label: "Status", className: "" },
  { label: "Checks", className: "" },
  { label: "Time", className: "" },
  { label: "Lines", className: "hidden xl:block" },
  { label: "Tokens / budget", className: "" },
  { label: "Cost / fix", className: "text-right" },
];

function useMoves(lanes: Lane[]) {
  const previous = useRef(new Map(lanes.map((lane) => [lane.candidate.agent, lane.rank])));
  const [moves, setMoves] = useState<Map<string, number>>(new Map());
  const order = lanes.map((lane) => lane.candidate.agent).join(",");
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run only when the order changes
  useEffect(() => {
    const next = new Map<string, number>();
    for (const lane of lanes) {
      const before = previous.current.get(lane.candidate.agent);
      if (before !== undefined && before !== lane.rank)
        next.set(lane.candidate.agent, before - lane.rank);
    }
    previous.current = new Map(lanes.map((lane) => [lane.candidate.agent, lane.rank]));
    if (next.size === 0) return;
    setMoves(next);
    const timer = setTimeout(() => setMoves(new Map()), 1200);
    return () => clearTimeout(timer);
  }, [order]);
  return moves;
}

function Move({ by }: { by: number | undefined }) {
  if (!by) return null;
  return (
    <span className={cn("num text-[11px] font-bold", by > 0 ? "text-go-ink" : "text-ink-3")}>
      {by > 0 ? "▲" : "▼"}
      {Math.abs(by)}
    </span>
  );
}

const muted = (status: Lane["status"]) =>
  status === "dismissing" || status === "dismissed" || status === "over-budget";

function Dim({
  lane,
  lights = false,
  children,
}: {
  lane: Lane;
  lights?: boolean;
  children: React.ReactNode;
}) {
  const out = lane.status === "dismissing" || lane.status === "dismissed";
  return (
    <span
      className="inline-flex transition-[opacity,filter] duration-[360ms] motion-reduce:transition-none"
      style={{
        opacity: lights ? 1 : (DIM[lane.status] ?? 1),
        filter: lights && out ? "saturate(.35) brightness(.85)" : "none",
        transitionDelay: lane.status === "dismissing" ? "1.6s" : "0s",
      }}
    >
      {children}
    </span>
  );
}

const DIM: Partial<Record<Lane["status"], number>> = {
  dismissing: 0.55,
  dismissed: 0.5,
  "over-budget": 0.8,
};

function TimeCell({ lane, frame }: { lane: Lane; frame: Frame }) {
  const c = lane.candidate;
  const working = lane.seconds === null && (lane.status === "working" || lane.status === "drawn");
  return (
    <div
      role="cell"
      className={cn(
        "-mx-2 rounded-control px-2 py-1.5 transition-[opacity,background-color] duration-200",
        lane.best.time && "bg-best-tint",
      )}
    >
      <Tip
        label={
          lane.best.time
            ? "Fastest verified time in this tryout. From when Switch created the agent to its last commit."
            : "From when Switch created the agent to its last commit."
        }
        className={cn(
          "num block text-[20px] leading-none font-[750] wdth-75",
          lane.best.time && "text-best-ink",
          lane.status === "drawn" && "text-ink-3",
        )}
      >
        {lane.seconds !== null ? (
          elapsed(lane.seconds)
        ) : working && lane.status === "working" ? (
          <Ticker from={ms(c.createdAt)} until={null} at={frame.at} />
        ) : (
          "—"
        )}
      </Tip>
      <span className="mt-1 block text-[12px] leading-4 text-ink-3">
        {lane.seconds !== null
          ? "to finish"
          : lane.status === "over-budget"
            ? "stopped"
            : "on the clock"}
      </span>
    </div>
  );
}

function CostCell({ lane, record }: { lane: Lane; record: TryoutRecord }) {
  return (
    <div
      role="cell"
      className={cn(
        "-mx-2 rounded-control px-2 py-1.5 text-right transition-[opacity,background-color] duration-200",
        lane.best.cost && "bg-best-tint",
      )}
    >
      <CostTicker
        value={lane.perFix}
        asOf={record.prices.asOf}
        className={cn(
          "text-[17px] leading-none font-[650] wdth-85",
          lane.best.cost && "text-best-ink",
        )}
      />
      <span className="mt-1 block text-[12px] leading-4 text-ink-3">
        {lane.perFix !== null
          ? lane.best.cost
            ? "cheapest fix"
            : "per verified fix"
          : lane.spent !== null
            ? `${dollars(lane.spent)} spent`
            : " "}
      </span>
    </div>
  );
}

function Stamp({ record }: { record: TryoutRecord }) {
  const hire = record.hire;
  if (!hire) return null;
  return (
    <motion.div
      initial={{ scale: 1.35, rotate: -9, opacity: 0, y: -8 }}
      animate={{ scale: 1, rotate: -3, opacity: 1, y: 0 }}
      transition={STAMP}
      className="absolute top-1/2 -left-6 z-10 -mt-[28px] origin-left scale-[0.82] xl:-left-3 xl:scale-[0.9] min-[1400px]:-left-14 min-[1400px]:scale-100"
    >
      <HiredStamp
        role={record.role}
        date={hire.approval.answeredAt ?? hire.at}
        approver={ownerOf(record)}
        app={appOf(record, hire.approval.room)}
        size="card"
      />
    </motion.div>
  );
}

function LaneRow({
  lane,
  frame,
  record,
  lightsOut,
  move,
  hovered,
  onHover,
}: {
  lane: Lane;
  frame: Frame;
  record: TryoutRecord;
  lightsOut: number | null;
  move: number | undefined;
  hovered: boolean;
  onHover: (agent: string | null) => void;
}) {
  const reduce = useReducedMotion();
  const c = lane.candidate;
  const hired = lane.status === "hired";
  const verifiedTint = lane.status === "verified" || lane.status === "recommended";
  return (
    <motion.div
      layout="position"
      role="row"
      aria-label={`Position ${lane.rank}: ${c.agent}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: RESORT, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={() => onHover(c.agent)}
      onPointerLeave={() => onHover(null)}
      className={cn(
        "relative grid h-24 grid-cols-1 items-center gap-x-4 border-b border-line pr-5 pl-6 last:border-b-0",
        muted(lane.status) && "muted",
        GRID,
        lane.status === "recommended" && "outline-2 outline-dashed outline-hold -outline-offset-2",
        hovered && "outline-2 -outline-offset-2",
      )}
      style={hovered ? { outlineColor: bibColor(c.bib), outlineStyle: "solid" } : {}}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-200",
          hired ? "foil w-1.5" : "w-1",
        )}
        style={hired ? undefined : { backgroundColor: bibColor(c.bib) }}
      />
      {verifiedTint && (
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-go opacity-[0.07]" />
      )}
      <div role="cell" className={cn("flex flex-col items-start gap-1")}>
        <span className="flex items-center gap-1">
          <span className="num text-[30px] leading-none font-[800] wdth-62">{lane.rank}</span>
          {hired && <Crown className="size-4 text-hire-ink" aria-label="Hired" />}
        </span>
        <Move by={move} />
      </div>
      <div role="cell" className={cn("flex min-w-0 items-center gap-3")}>
        <Dim lane={lane}>
          <Bib n={c.bib} size={32} />
        </Dim>
        <span className="min-w-0">
          <span className="block truncate text-[17px] leading-[22px] font-[650]">{c.agent}</span>
          <span
            className="block truncate text-[13px] leading-[18px] text-ink-3"
            title={c.model ?? undefined}
          >
            {lane.vendor} ·{" "}
            {c.model ? <span className="mono text-[12px]">{c.model}</span> : "model not reported"}
          </span>
        </span>
      </div>
      <div role="cell" className="relative min-w-0">
        <AnimatePresence initial={false}>
          {hired && <Stamp key="stamp" record={record} />}
        </AnimatePresence>
        <div className={cn(hired && "invisible")}>
          <StatusChip status={lane.status} />
          <span className="mt-1 line-clamp-2 text-[12px] leading-4 text-ink-3">
            {detailOf(lane, record)}
          </span>
        </div>
      </div>
      <div role="cell">
        <Dim lane={lane} lights>
          <CheckLights lights={lane.lights} lightsOut={lightsOut} />
        </Dim>
      </div>
      <TimeCell lane={lane} frame={frame} />
      <div
        role="cell"
        className={cn("num hidden text-[17px] font-[650] text-ink-2 wdth-85 xl:block")}
      >
        {c.diff && lane.seconds !== null ? diff(c.diff) : "—"}
      </div>
      <div role="cell">
        <BudgetMeter budget={lane.budget} />
      </div>
      <CostCell lane={lane} record={record} />
    </motion.div>
  );
}

function LaneCard({
  lane,
  record,
  frame,
  lightsOut,
}: {
  lane: Lane;
  record: TryoutRecord;
  frame: Frame;
  lightsOut: number | null;
}) {
  const c = lane.candidate;
  const hired = lane.status === "hired";
  return (
    <motion.li
      layout="position"
      transition={{ layout: RESORT }}
      className={cn("panel relative overflow-hidden py-4 pr-4 pl-5", muted(lane.status) && "muted")}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0", hired ? "foil w-1.5" : "w-1")}
        style={hired ? undefined : { backgroundColor: bibColor(c.bib) }}
      />
      <div className={cn("flex items-start gap-3")}>
        <span className="num w-6 pt-0.5 text-[26px] leading-none font-[800] wdth-62">
          {lane.rank}
        </span>
        <Dim lane={lane}>
          <Bib n={c.bib} size={32} />
        </Dim>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-[17px] leading-[22px] font-[650]">{c.agent}</span>
            <StatusChip status={lane.status} />
          </div>
          <span className="block truncate text-[13px] leading-[18px] text-ink-3">
            {lane.vendor} ·{" "}
            {c.model ? <span className="mono text-[12px]">{c.model}</span> : "model not reported"}
          </span>
          <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-ink-2">
            {detailOf(lane, record)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 pl-9">
        <Dim lane={lane} lights>
          <CheckLights lights={lane.lights} lightsOut={lightsOut} size={16} />
        </Dim>
        <span className={cn("num text-[20px] leading-none font-[750] wdth-75")}>
          {lane.seconds !== null ? (
            elapsed(lane.seconds)
          ) : lane.status === "working" ? (
            <Ticker from={ms(c.createdAt)} until={null} at={frame.at} />
          ) : (
            "—"
          )}
        </span>
        <span className={cn("ml-auto")}>
          <CostTicker
            value={lane.perFix}
            asOf={record.prices.asOf}
            className="text-[17px] leading-none font-[650] wdth-85"
          />
        </span>
        <span className={cn("basis-full")}>
          <BudgetMeter budget={lane.budget} compact />
        </span>
      </div>
      {hired && record.hire && (
        <div className="mt-3 pl-9">
          <HiredStamp
            role={record.role}
            date={record.hire.approval.answeredAt ?? record.hire.at}
            approver={ownerOf(record)}
            app={appOf(record, record.hire.approval.room)}
            size="card"
            className="-rotate-3"
          />
        </div>
      )}
    </motion.li>
  );
}

function HireLine({ className }: { className?: string }) {
  return (
    <motion.div
      layout="position"
      transition={{ layout: RESORT }}
      className={cn("relative flex h-5 items-center", className)}
      aria-hidden
    >
      <span className="h-px flex-1 border-t border-dashed border-go" />
      <span className="caps px-3 text-go-ink">Can be hired ↑</span>
      <span className="h-px flex-1 border-t border-dashed border-go" />
    </motion.div>
  );
}

export function Tower({
  frame,
  record,
  lightsOut = null,
  hovered = null,
  onHover = () => {},
}: {
  frame: Frame;
  record: TryoutRecord;
  lightsOut?: number | null;
  hovered?: string | null;
  onHover?: (agent: string | null) => void;
}) {
  const moves = useMoves(frame.lanes);
  const rows = frame.lanes.flatMap((lane, i) => {
    const row = { kind: "lane" as const, lane };
    return frame.verified > 0 && i === frame.verified - 1 && i < frame.lanes.length - 1
      ? [row, { kind: "line" as const }]
      : [row];
  });
  return (
    <LayoutGroup>
      <div
        role="table"
        aria-label={`Tryout #${record.issue} standings`}
        className="panel hidden overflow-hidden lg:block"
      >
        <div
          role="row"
          className={cn(
            "grid h-8 items-center gap-x-4 border-b border-line-strong bg-surface-2 pr-5 pl-6",
            GRID,
          )}
        >
          {HEADERS.map((header) => (
            <span
              key={header.label}
              role="columnheader"
              className={cn("caps text-ink-3", header.className)}
            >
              {header.label === "Checks" ? (
                <>
                  <span className="sr-only">Checks</span>
                  <LightLabels className="pl-3" />
                </>
              ) : (
                header.label
              )}
            </span>
          ))}
        </div>
        <div role="rowgroup">
          <AnimatePresence initial={false}>
            {rows.map((row) =>
              row.kind === "line" ? (
                <HireLine key="line" className="border-b border-line" />
              ) : (
                <LaneRow
                  key={row.lane.candidate.agent}
                  lane={row.lane}
                  frame={frame}
                  record={record}
                  lightsOut={lightsOut}
                  move={moves.get(row.lane.candidate.agent)}
                  hovered={hovered === row.lane.candidate.agent}
                  onHover={onHover}
                />
              ),
            )}
          </AnimatePresence>
        </div>
      </div>
      <ol
        aria-label={`Tryout #${record.issue} standings`}
        className="flex flex-col gap-3 lg:hidden"
      >
        {rows.map((row) =>
          row.kind === "line" ? (
            <li key="line" aria-hidden>
              <HireLine />
            </li>
          ) : (
            <LaneCard
              key={row.lane.candidate.agent}
              lane={row.lane}
              record={record}
              frame={frame}
              lightsOut={lightsOut}
            />
          ),
        )}
      </ol>
    </LayoutGroup>
  );
}
