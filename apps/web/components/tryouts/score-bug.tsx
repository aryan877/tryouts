"use client";

import type { FeedItem, TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { appOf, type Frame, ownerOf, stopOf } from "@/lib/board";
import { day, ms } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppGlyph } from "./app-glyph";
import { RichText, SourceMark } from "./feed-parts";
import { PhaseRail } from "./phase-rail";
import { Ticker } from "./ticker";

export type BoardMode = "live" | "recorded" | "replay";

function ModeTag({
  mode,
  record,
  speed,
}: {
  mode: BoardMode;
  record: TryoutRecord;
  speed?: number | undefined;
}) {
  if (mode === "live") {
    return (
      <span className="caps inline-flex items-center gap-1.5 text-screen-ink">
        <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-live" />
        Live
      </span>
    );
  }
  if (mode === "replay") {
    return <span className="caps text-screen-ink-2">Replay {speed}×</span>;
  }
  return (
    <span className="caps whitespace-nowrap text-screen-ink-2">
      <span className="hidden sm:inline">Recorded · </span>
      {day(record.startedAt, false)}
    </span>
  );
}

export function LatestLine({
  item,
  bibs,
  className,
}: {
  item: FeedItem | undefined;
  bibs?: Map<string, number>;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative h-7 overflow-hidden perspective-[600px]", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {item && (
          <motion.p
            key={`${item.at}-${item.actor}`}
            initial={reduce ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className="absolute inset-0 flex items-center gap-2 truncate text-[13px] text-screen-ink-2"
          >
            <SourceMark item={item} {...(bibs ? { bibs } : {})} />
            <span className="font-semibold text-screen-ink">{item.actor}</span>
            <span className="truncate">
              <RichText text={item.text} />
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ScoreBug({
  record,
  frame,
  mode,
  speed,
  lightsOut,
}: {
  record: TryoutRecord;
  frame: Frame;
  mode: BoardMode;
  speed?: number | undefined;
  lightsOut: number | null;
}) {
  const owner = ownerOf(record);
  return (
    <div className="screen sticky top-14 z-30 rounded-panel">
      <div className="flex h-11 items-center gap-3 border-b border-screen-line px-4 sm:gap-4 lg:gap-5 lg:px-5">
        <ModeTag mode={mode} record={record} speed={speed} />
        <span className="hidden h-5 w-px bg-screen-line sm:block" aria-hidden />
        <h1 className="caps shrink-0 text-[13px] whitespace-nowrap text-screen-ink">
          <span className="hidden sm:inline">Tryout </span>#{record.issue} · {record.role}
        </h1>
        <span className="hidden min-w-0 truncate text-[15px] text-screen-ink-2 md:block">
          {record.title}
        </span>
        <span className="ml-auto" />
        <span
          className={cn(
            "num text-[24px] leading-none font-[750] transition-opacity wdth-75 lg:text-[28px]",
            lightsOut !== null && "opacity-40",
          )}
        >
          <span className="sr-only">Tryout clock </span>
          <Ticker from={ms(record.startedAt)} until={stopOf(record)} at={frame.at} />
        </span>
        <PhaseRail
          phase={frame.phase}
          probation={{ done: frame.probation, of: record.probation.of }}
          className="hidden lg:inline-flex"
        />
        <span className="hidden items-center gap-1.5 text-[13px] text-screen-ink-2 xl:inline-flex">
          <span className="grid size-5 place-items-center rounded-full bg-screen-line text-[11px] font-bold text-screen-ink">
            {owner.slice(0, 1)}
          </span>
          {owner}
          <AppGlyph app={appOf(record, record.posted.room)} />
        </span>
      </div>
      <LatestLine
        item={
          lightsOut !== null
            ? {
                at: record.startedAt,
                actor: "Switch",
                kind: "switch",
                room: record.posted.room,
                text: `Lights out: ${record.candidates.length} candidates, same bug.`,
              }
            : frame.feed[0]
        }
        bibs={new Map(record.candidates.map((c) => [c.agent, c.bib]))}
        className="px-4 lg:px-5"
      />
    </div>
  );
}
