"use client";

import type { FeedItem, TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ArrowUpRight } from "@/components/icons";
import { appOf, roomOf } from "@/lib/board";
import { clock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppGlyph } from "./app-glyph";
import { RichText, SourceMark } from "./feed-parts";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "referee", label: "Referee" },
  { id: "switch", label: "Switch" },
  { id: "person", label: "People" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

const VERDICT = /\b(VERIFIED|REFUTED|Hired)\b/;

export function RefereeFeed({
  record,
  items,
  className,
}: {
  record: TryoutRecord;
  items: FeedItem[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const bibs = new Map(record.candidates.map((c) => [c.agent, c.bib]));
  const shown = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const announced = items.find((item) => VERDICT.test(item.text) && item.kind !== "person");

  return (
    <section aria-labelledby="feed-title" className={cn("panel flex flex-col", className)}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3">
        <h2 id="feed-title" className="caps text-ink">
          Referee feed
        </h2>
        <span className="text-[12px] text-ink-3">Times in UTC</span>
        <fieldset className="ml-auto flex gap-1">
          <legend className="sr-only">Filter the feed</legend>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-7 rounded-chip px-2.5 text-[12px] font-semibold transition-colors duration-100",
                filter === f.id
                  ? "bg-ink text-on-ink"
                  : "text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface-2",
              )}
            >
              {f.label}
            </button>
          ))}
        </fieldset>
      </header>
      <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain perspective-[800px]">
        <AnimatePresence initial={false}>
          {shown.map((item) => {
            const room = roomOf(record, item.room);
            return (
              <motion.li
                key={`${item.at}-${item.actor}-${item.room}`}
                layout="position"
                initial={reduce ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "top" }}
                className="relative grid grid-cols-[60px_20px_minmax(0,1fr)_auto] items-start gap-x-2.5 border-b border-line px-4 py-2 text-[13px] leading-[18px] last:border-b-0"
              >
                {item.kind === "referee" && (
                  <span aria-hidden className="zebra absolute inset-y-0 left-0 w-[3px]" />
                )}
                <time
                  dateTime={item.at}
                  className="mono pt-px text-[12px] text-ink-3"
                  title={item.at}
                >
                  {clock(item.at)}
                </time>
                <SourceMark item={item} bibs={bibs} className="-mt-px" />
                <p className="min-w-0 text-ink-2">
                  <span className="mr-1.5 font-semibold text-ink">{item.actor}</span>
                  <RichText text={item.text} />
                </p>
                <span className="flex items-center gap-1 pt-px text-ink-3">
                  <span className="mono hidden text-[11px] sm:inline">#{item.room}</span>
                  <AppGlyph app={appOf(record, item.room)} />
                  {room?.url && (
                    <a
                      href={room.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open #${item.room}`}
                      className="hover:text-ink"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
      <p className="sr-only" aria-live="polite">
        {announced ? `${announced.actor}: ${announced.text}` : ""}
      </p>
    </section>
  );
}
