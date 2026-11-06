"use client";

import { AGENTS, ALIAS, MACHINE, VENDORS } from "@tryouts/kit";
import type { TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Laptop } from "@/components/icons";
import { appOf, type Frame, type Lane } from "@/lib/board";
import { clock, ms, plural, shortClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppGlyph } from "./app-glyph";
import { bibColor } from "./bib";
import { Tip } from "./tip";

const EASE = [0.16, 1, 0.3, 1] as const;

function Elbow({ last, dashed, reduce }: { last: boolean; dashed: boolean; reduce: boolean }) {
  const draw = reduce ? { opacity: 0 } : { pathLength: 0 };
  const shown = reduce ? { opacity: 1 } : { pathLength: 1 };
  return (
    <svg
      aria-hidden
      className="absolute top-0 left-0 h-full w-8 overflow-visible text-line-strong"
      viewBox="0 0 32 52"
    >
      {!last && (
        <motion.path
          d="M12 0V52"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          initial={draw}
          animate={shown}
          transition={{ duration: 0.22, ease: EASE }}
        />
      )}
      <motion.path
        d="M12 0V18Q12 22 16 22H27"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeDasharray={dashed ? "3 3" : undefined}
        initial={draw}
        animate={shown}
        transition={{ duration: 0.3, delay: 0.12, ease: EASE }}
      />
    </svg>
  );
}

function Node({
  lane,
  record,
  frame,
  last,
  hovered,
  onHover,
}: {
  lane: Lane;
  record: TryoutRecord;
  frame: Frame;
  last: boolean;
  hovered: boolean;
  onHover: (agent: string | null) => void;
}) {
  const reduce = !!useReducedMotion();
  const c = lane.candidate;
  const deletion = record.deletions.find((d) => d.agent === c.agent && ms(d.at) <= frame.at);
  const hired = lane.status === "hired";
  const aliased = hired && record.admitted && ms(record.admitted.at) <= frame.at;
  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: 0.26, ease: EASE }}
      onPointerEnter={() => onHover(c.agent)}
      onPointerLeave={() => onHover(null)}
      className={cn("relative h-[52px] rounded-control pl-8 transition-shadow")}
      style={hovered ? { boxShadow: `inset 0 0 0 2px ${bibColor(c.bib)}` } : {}}
    >
      <Elbow last={last} dashed={!!deletion} reduce={reduce} />
      <span
        aria-hidden
        className={cn(
          "absolute top-[17px] left-[27px] size-2.5 rounded-full",
          hired && "ring-2 ring-hire ring-offset-2 ring-offset-surface",
          deletion && "opacity-50",
        )}
        style={{ backgroundColor: bibColor(c.bib) }}
      />
      <div className={cn("pt-2 pl-3.5", deletion && "text-ink-3")}>
        <p className="flex items-baseline gap-2 text-[13px] leading-[18px]">
          <span
            className={cn(
              "mono font-medium",
              deletion ? "text-ink-3 line-through decoration-ink-4" : "text-ink",
            )}
          >
            {c.agent}
          </span>
          <span className="text-ink-3">{lane.vendor}</span>
          {hired && (
            <span className="caps ml-auto text-hire-ink">
              {aliased ? `@${ALIAS} in #${record.admitted?.room}` : "Hired"}
            </span>
          )}
          {!hired && deletion && (
            <span className="ml-auto text-[11px] text-ink-3">
              deleted {shortClock(deletion.at)} · confirmed by {deletion.confirmedBy}
            </span>
          )}
          {!hired && !deletion && frame.hired && (
            <span className="ml-auto text-[11px] text-ink-3">deletion requested</span>
          )}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-4 text-ink-3">
          <Laptop className="size-3" />
          {c.machine}
          <span aria-hidden>·</span>
          <span className="mono">#{c.room}</span>
          <AppGlyph app={appOf(record, c.room)} className="size-3" />
        </p>
      </div>
    </motion.li>
  );
}

export function RunTree({
  record,
  frame,
  hovered = null,
  onHover = () => {},
  className,
}: {
  record: TryoutRecord;
  frame: Frame;
  hovered?: string | null;
  onHover?: (agent: string | null) => void;
  className?: string;
}) {
  const children = [...frame.lanes].sort(
    (a, b) => ms(a.candidate.createdAt) - ms(b.candidate.createdAt),
  );
  const created = children[0]?.candidate.createdAt;
  const vendors = new Set(record.candidates.map((c) => VENDORS[c.vendor]?.provider ?? c.vendor))
    .size;
  return (
    <section aria-labelledby="tree-title" className={cn("panel", className)}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <h2 id="tree-title" className="caps text-ink">
          <Tip label="Who created whom, on which machine. From Switch's agent registry.">
            Switch run tree
          </Tip>
        </h2>
        <span className="ml-auto text-[12px] text-ink-3">Agents creating agents</span>
      </header>
      <div className="px-4 pt-3 pb-4">
        <div className="relative pl-8">
          <span
            aria-hidden
            className="absolute top-[7px] left-[7px] size-2.5 rotate-45 rounded-[1px] bg-ink"
          />
          <p className="flex items-baseline gap-2 text-[13px] leading-[18px]">
            <span className="mono font-medium text-ink">{AGENTS.hiring.name}</span>
            <span className="text-ink-3">{AGENTS.hiring.displayName} · OpenCode</span>
            <span className="caps ml-auto text-ink-3">Owner {record.posted.by}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] leading-4 text-ink-3">
            <Laptop className="size-3" />
            {MACHINE}
            <span aria-hidden>·</span>
            <span className="mono">#{record.posted.room}</span>
            <AppGlyph app={appOf(record, record.posted.room)} className="size-3" />
            <span aria-hidden>·</span>
            can manage agents
          </p>
        </div>
        <div className="relative mt-2 h-6 pl-8">
          <svg aria-hidden className="absolute top-0 left-0 h-full w-8 text-line-strong">
            <path d="M12 0V24" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span className="mono inline-flex h-5 items-center rounded-chip bg-surface-2 px-1.5 text-[11px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">
            run_template tryout · v2 · if: {record.candidates.length} of{" "}
            {Object.keys(VENDORS).length} slots
            {created && <span className="ml-1.5 text-ink-3">{clock(created)}</span>}
          </span>
        </div>
        <ol aria-label="Candidates created by hiring">
          <AnimatePresence initial={false}>
            {children.map((lane, i) => (
              <Node
                key={lane.candidate.agent}
                lane={lane}
                record={record}
                frame={frame}
                last={i === children.length - 1}
                hovered={hovered === lane.candidate.agent}
                onHover={onHover}
              />
            ))}
          </AnimatePresence>
        </ol>
      </div>
      <footer className="border-t border-line px-4 py-2.5 text-[12px] leading-4 text-ink-3">
        Created by {AGENTS.hiring.name} with run_template · bibs drawn in creation order · one
        Switch agent controller on {MACHINE} runs {plural(vendors, "vendor")}
      </footer>
    </section>
  );
}
