"use client";

import type { TryoutRecord } from "@tryouts/kit/record";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { appOf, endOf, ownerOf, recommendationOf } from "@/lib/board";
import { ms } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ApprovalCard } from "./approval-card";
import { Handover } from "./handover";
import { LinkedRooms } from "./linked-rooms";
import { OnTheClockBand } from "./on-the-clock-band";
import { RefereeFeed } from "./referee-feed";
import { RunTree } from "./run-tree";
import { ScoreBug } from "./score-bug";
import { TimeProvider } from "./ticker";
import { Tower } from "./tower";
import { useReplay } from "./use-replay";

const TABS = [
  { id: "feed", label: "Feed" },
  { id: "tree", label: "Run tree" },
  { id: "rooms", label: "Rooms" },
] as const;

function useLive(initial: TryoutRecord) {
  const [record, setRecord] = useState(initial);
  const live = record.source === "live" && !record.endedAt;
  const [at, setAt] = useState(() => endOf(initial));
  useEffect(() => {
    if (!live) return;
    const tick = setInterval(() => setAt(Date.now()), 1000);
    const poll = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const response = await fetch(`/records/${record.issue}.json`, { cache: "no-store" });
      if (response.ok) setRecord((await response.json()) as TryoutRecord);
    }, 4000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [live, record.issue]);
  return { record, live, at: live ? at : endOf(record) };
}

export function Board({ record: initial }: { record: TryoutRecord }) {
  const { record, live, at } = useLive(initial);
  const replay = useReplay(record, at);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("feed");
  const { frame } = replay;
  const hire = record.hire;
  const owner = ownerOf(record);
  const mode = replay.playing ? "replay" : live ? "live" : "recorded";
  const now = replay.now ?? (live ? Date.now : null);

  return (
    <TimeProvider value={now}>
      <div ref={replay.scope} className="container-page pt-4 pb-24">
        <ScoreBug
          record={record}
          frame={frame}
          mode={mode}
          speed={replay.plan.speed}
          lightsOut={replay.lightsOut}
        />
        {hire && (
          <OnTheClockBand
            approval={frame.approval}
            owner={owner}
            app={appOf(record, hire.approval.room)}
            room={hire.approval.room}
            askedAt={ms(hire.approval.askedAt)}
            at={frame.at}
            className="mt-2"
          />
        )}
        <div className="mt-4">
          {frame.lanes.length === 0 ? (
            <div className="panel grid h-40 place-items-center text-[15px] text-ink-3">
              {owner} posted the job. Switch is creating the candidates.
            </div>
          ) : (
            <Tower
              frame={frame}
              record={record}
              lightsOut={replay.lightsOut}
              hovered={hovered}
              onHover={setHovered}
            />
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="text-[13px] leading-[18px] text-ink-3">
            <span className="caps mr-2 text-ink-2">Order</span>
            {record.rule} Same rule as the hiring manager.
          </p>
          <span className="ml-auto flex items-center gap-2">
            {!live && (
              <Button variant="ghost" size="sm" onClick={replay.play} disabled={replay.playing}>
                <Play className="size-3.5" />
                Replay · {Math.round(replay.plan.duration / 1000)} s
              </Button>
            )}
            <AnimatePresence initial={false}>
              {frame.hired && hire && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.22 }}
                >
                  <Button asChild>
                    <Link href={`/hires/${hire.agent}`}>
                      See the hire record <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Board panels"
          className="mt-8 flex gap-1 rounded-control bg-surface-2 p-1 xl:hidden"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-9 flex-1 rounded-[6px] text-[13px] font-semibold transition-colors",
                tab === t.id ? "bg-surface text-ink shadow-panel" : "text-ink-3",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-6 xl:mt-8 xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-7">
            <AnimatePresence initial={false}>
              {hire && frame.approval !== "hidden" && (
                <motion.div
                  key="approval"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ApprovalCard
                    approval={hire.approval}
                    agent="hiring"
                    owner={owner}
                    state={frame.approval === "open" ? "open" : "answered"}
                    app={appOf(record, hire.approval.room)}
                    at={frame.at}
                    recommendation={recommendationOf(record)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <RefereeFeed
              record={record}
              items={frame.feed}
              className={cn("max-h-[560px] min-h-[320px]", tab !== "feed" && "hidden xl:flex")}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-6 xl:col-span-5">
            <RunTree
              record={record}
              frame={frame}
              hovered={hovered}
              onHover={setHovered}
              className={cn(tab !== "tree" && "hidden xl:block")}
            />
            {frame.hired && (
              <Handover
                record={record}
                at={frame.at}
                className={cn(tab !== "tree" && "hidden xl:block")}
              />
            )}
            <LinkedRooms record={record} className={cn(tab !== "rooms" && "hidden xl:block")} />
          </div>
        </div>
      </div>
    </TimeProvider>
  );
}
