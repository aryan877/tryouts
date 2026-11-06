"use client";

import { AGENTS, MACHINE } from "@tryouts/kit";
import type { TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Play } from "@/components/icons";
import { APP_LABEL, AppGlyph } from "@/components/tryouts/app-glyph";
import { Bib, bibColor } from "@/components/tryouts/bib";
import { CheckLights, LightLabels } from "@/components/tryouts/check-lights";
import { HiredStamp } from "@/components/tryouts/hired-stamp";
import { Rolling } from "@/components/tryouts/rolling";
import { LatestLine } from "@/components/tryouts/score-bug";
import { Ticker, TimeProvider } from "@/components/tryouts/ticker";
import { useAutoplay, useReplay } from "@/components/tryouts/use-replay";
import { appOf, type Frame, type Lane, ownerOf, stopOf } from "@/lib/board";
import { day, dollars, elapsed, ms, tokens } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRID =
  "grid grid-cols-[22px_minmax(0,1fr)_auto] gap-x-3 pr-4 pl-5 sm:grid-cols-[24px_minmax(0,1fr)_auto_64px_88px] sm:gap-x-4";
const RESORT = { type: "spring", stiffness: 420, damping: 40 } as const;
const STAMP = { type: "spring", stiffness: 760, damping: 24, mass: 0.8, delay: 1 } as const;

function HeroLane({
  lane,
  record,
  lightsOut,
  at,
}: {
  lane: Lane;
  record: TryoutRecord;
  lightsOut: number | null;
  at: number;
}) {
  const c = lane.candidate;
  const hired = lane.status === "hired";
  const out = lane.status === "dismissing" || lane.status === "dismissed";
  const hire = record.hire;
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: RESORT, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={cn(GRID, "relative h-[68px] items-center border-b border-screen-line")}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0", hired ? "foil w-1.5" : "w-1")}
        style={hired ? undefined : { backgroundColor: bibColor(c.bib) }}
      />
      <span
        className={cn(
          "num text-[24px] leading-none font-[800] wdth-62 transition-opacity duration-[360ms]",
          out && "text-screen-ink-3",
        )}
      >
        {lane.rank}
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-2.5 transition-opacity duration-[360ms]",
          out && "text-screen-ink-3",
        )}
        style={{ transitionDelay: lane.status === "dismissing" ? "1.6s" : "0s" }}
      >
        <span
          className="inline-flex transition-opacity duration-[360ms]"
          style={{ opacity: out ? 0.55 : 1 }}
        >
          <Bib n={c.bib} size={24} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] leading-5 font-[650]">{c.agent}</span>
          <span className="block truncate text-[12px] leading-4 text-screen-ink-2">
            {hired ? (
              <>
                <span className="font-semibold text-hire-ink sm:hidden">Hired · {record.role}</span>
                <span className="hidden sm:inline">{lane.vendor}</span>
              </>
            ) : lane.verdict === "refuted" ? (
              "Refuted"
            ) : lane.status === "over-budget" ? (
              "Over budget"
            ) : lane.status === "working" ||
              lane.status === "checking" ||
              lane.status === "ready" ? (
              <span className="inline-flex items-center gap-1.5">
                {lane.vendor} ·
                <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-hold" />
                {lane.status === "working" ? "working" : "referee checking"}
              </span>
            ) : (
              lane.vendor
            )}
          </span>
        </span>
        {hired && hire && (
          <span className="relative ml-auto hidden h-px w-[156px] shrink-0 sm:block">
            <motion.div
              key="stamp"
              initial={{ scale: 1.35, rotate: -9, opacity: 0, y: -8 }}
              animate={{ scale: 1, rotate: -3, opacity: 1, y: 0 }}
              transition={STAMP}
              className="pointer-events-none absolute top-1/2 left-0 z-10 -mt-[23px]"
            >
              <HiredStamp
                role={record.role}
                date={hire.approval.answeredAt ?? hire.at}
                approver={ownerOf(record)}
                app={appOf(record, hire.approval.room)}
                size="hero"
              />
            </motion.div>
          </span>
        )}
      </span>
      <span
        className="transition-[opacity,filter] duration-[360ms]"
        style={out ? { opacity: 0.6, filter: "saturate(.35)" } : {}}
      >
        <CheckLights lights={lane.lights} lightsOut={lightsOut} size={12} className="sm:hidden" />
        <CheckLights
          lights={lane.lights}
          lightsOut={lightsOut}
          size={20}
          className="hidden sm:inline-flex"
        />
      </span>
      <span
        className={cn(
          "num hidden text-right text-[18px] leading-none font-[750] wdth-75 sm:block",
          out && "text-screen-ink-3",
          lane.best.time && "text-best-ink",
        )}
      >
        {lane.seconds !== null ? (
          elapsed(lane.seconds)
        ) : lane.status === "working" ? (
          <Ticker from={ms(c.createdAt)} until={null} at={at} className="text-screen-ink-2" />
        ) : (
          "—"
        )}
      </span>
      <span className={cn("hidden text-right sm:block", out && "text-screen-ink-3")}>
        {lane.perFix !== null ? (
          <span className="inline-flex items-baseline gap-1">
            <Rolling
              text={dollars(lane.perFix)}
              className={cn(
                "text-[16px] leading-none font-[650] wdth-85",
                lane.best.cost && "text-best-ink",
              )}
            />
            <span className="text-[10px] text-screen-ink-3">est.</span>
          </span>
        ) : (
          <span className="num text-[14px] text-screen-ink-3">—</span>
        )}
      </span>
    </motion.li>
  );
}

function SwitchStrip({ record, frame }: { record: TryoutRecord; frame: Frame }) {
  const owner = ownerOf(record);
  const app = appOf(record, record.hire?.approval.room ?? record.posted.room);
  const limit = record.candidates.find((c) => c.budget)?.budget?.limit;
  const cells = [
    {
      label: "Agents create agents",
      value: `${AGENTS.hiring.name} ran run_template: ${record.candidates.length} agents on ${MACHINE}`,
      active: frame.phase === "create",
    },
    {
      label: "Budget per agent",
      value: limit
        ? `${tokens(limit)} output tokens each, enforced by Switch`
        : "Usage counted by Switch",
      active: frame.phase === "race",
    },
    {
      label: "Owner-only card",
      value: `Only ${owner} could answer it${app ? ` in ${APP_LABEL[app]}` : ""}`,
      active: frame.phase === "pick",
    },
    {
      label: "Room ownership",
      value: record.admitted
        ? `Switch refused ${AGENTS.hiring.name} in #${record.admitted.room}; ${record.admitted.by} let the hire in`
        : "The hire's rooms are their owners' call",
      active:
        !!record.refusal &&
        frame.phase !== "pick" &&
        ms(record.refusal.at) <= frame.at &&
        frame.at < ms(record.refusal.at) + 120_000,
    },
  ];
  return (
    <div className="border-t border-screen-line">
      <p className="caps flex items-center gap-2 px-5 pt-3 text-screen-ink-3">
        <span className="size-1.5 rounded-full bg-[#30d158]" aria-hidden />
        Built on Switch · what it did in this run
      </p>
      <ul className="grid grid-cols-2 gap-px pt-2 lg:grid-cols-4">
        {cells.map((cell) => (
          <li
            key={cell.label}
            className={cn(
              "border-t-2 px-5 pt-2 pb-3 transition-colors duration-200",
              cell.active ? "border-hold" : "border-transparent",
            )}
          >
            <p
              className={cn(
                "text-[13px] leading-4 font-bold tracking-[0.04em] uppercase wdth-85",
                cell.active ? "text-hold-ink" : "text-screen-ink",
              )}
            >
              {cell.label}
            </p>
            <p className="mt-1.5 text-[13px] leading-[18px] text-screen-ink-2">{cell.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeroScreen({ record }: { record: TryoutRecord }) {
  const replay = useReplay(record);
  const target = useAutoplay(replay.play, true);
  const { frame } = replay;
  const owner = ownerOf(record);
  const app = appOf(record, record.hire?.approval.room ?? record.posted.room);
  return (
    <TimeProvider value={replay.now}>
      <div ref={target}>
        <div ref={replay.scope} className="screen overflow-hidden rounded-panel">
          <div className="flex h-12 items-center gap-3 border-b border-screen-line px-5">
            <span className="caps text-screen-ink-2">
              {replay.playing ? `Replay ${replay.plan.speed}×` : frame.hired ? "Final" : "Recorded"}
            </span>
            <span className="h-4 w-px bg-screen-line" aria-hidden />
            <span className="caps truncate text-[12px] text-screen-ink">
              Tryout #{record.issue} · {record.role}
            </span>
            <span
              className={cn(
                "num ml-auto text-[24px] leading-none font-[750] wdth-75 transition-opacity",
                replay.lightsOut !== null && "opacity-40",
              )}
            >
              <span className="sr-only">Tryout clock </span>
              <Ticker from={ms(record.startedAt)} until={stopOf(record)} at={frame.at} />
            </span>
          </div>
          <p className="truncate px-5 pt-3 text-[14px] text-screen-ink-2">{record.title}</p>
          <div
            aria-hidden
            className={cn(GRID, "caps h-8 items-center pt-1 text-[10px] text-screen-ink-3")}
          >
            <span>Pos</span>
            <span>Candidate</span>
            <LightLabels gap={12} width={20} screen className="hidden px-3 sm:flex" />
            <span className="hidden text-right sm:block">Time</span>
            <span className="hidden text-right sm:block">Cost / fix</span>
          </div>
          <LayoutGroup>
            <ol aria-label="Standings" className="min-h-[204px] border-t border-screen-line">
              <AnimatePresence initial={false}>
                {frame.lanes.map((lane) => (
                  <HeroLane
                    key={lane.candidate.agent}
                    lane={lane}
                    record={record}
                    lightsOut={replay.lightsOut}
                    at={frame.at}
                  />
                ))}
              </AnimatePresence>
            </ol>
          </LayoutGroup>
          <LatestLine
            item={frame.feed[0]}
            bibs={new Map(record.candidates.map((c) => [c.agent, c.bib]))}
            className="border-b border-screen-line px-5"
          />
          <SwitchStrip record={record} frame={frame} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-screen-line px-5 py-3 text-[12px] text-screen-ink-2">
            <span className="inline-flex items-center gap-1.5 text-screen-ink">
              Approved by {owner}
              {app && (
                <>
                  {" "}
                  in <AppGlyph app={app} label={false} className="size-3" /> {APP_LABEL[app]}
                </>
              )}{" "}
              · built on Switch
            </span>
            <span>Recorded run · {day(record.startedAt)}</span>
            <button
              type="button"
              onClick={replay.play}
              disabled={replay.playing}
              className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-control px-2 font-semibold text-screen-ink hover:bg-screen-line disabled:opacity-50"
            >
              <Play className="size-3" />
              Replay · {Math.round(replay.plan.duration / 1000)} s
            </button>
          </div>
        </div>
      </div>
    </TimeProvider>
  );
}
