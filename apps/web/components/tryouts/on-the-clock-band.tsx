"use client";

import type { App } from "@tryouts/kit/record";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_LABEL, AppGlyph } from "./app-glyph";
import { Ticker } from "./ticker";

export function OnTheClockBand({
  approval,
  owner,
  app,
  room,
  askedAt,
  at,
  className,
}: {
  approval: "hidden" | "open" | "answered";
  owner: string;
  app: App | null;
  room: string;
  askedAt: number;
  at: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [pickIn, setPickIn] = useState(false);
  const was = useRef(approval);
  useEffect(() => {
    if (was.current === "open" && approval === "answered") {
      setPickIn(true);
      const timer = setTimeout(() => setPickIn(false), 900);
      was.current = approval;
      return () => clearTimeout(timer);
    }
    was.current = approval;
  }, [approval]);
  const state = approval === "open" ? "clock" : pickIn ? "pick-in" : null;
  return (
    <AnimatePresence initial={false}>
      {state && (
        <motion.div
          key="band"
          initial={{ height: 0, opacity: reduce ? 0 : 1 }}
          animate={{ height: 56, opacity: 1 }}
          exit={{
            height: 0,
            opacity: reduce ? 0 : 1,
            transition: { duration: 0.24, ease: [0.55, 0, 1, 0.45] },
          }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={cn("screen overflow-hidden rounded-panel", className)}
          role="status"
        >
          <div className="relative flex h-14 items-center gap-4 px-5 perspective-[600px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={state}
                initial={reduce ? { opacity: 0 } : { rotateX: -90, x: state === "clock" ? -16 : 0 }}
                animate={{ rotateX: 0, x: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { rotateX: 90 }}
                transition={{ duration: 0.12 }}
                className="text-[20px] leading-none font-[750] tracking-[0.04em] uppercase wdth-75"
              >
                {state === "clock" ? "On the clock" : "The pick is in"}
              </motion.span>
            </AnimatePresence>
            <span className="flex items-center gap-1.5 text-[14px] text-screen-ink-2">
              {owner} · <AppGlyph app={app} label={false} className="size-3.5" />
              {app ? APP_LABEL[app] : "Switch"} #{room}
            </span>
            {state === "clock" && (
              <span className="num ml-auto text-[14px] text-screen-ink-2">
                waiting <Ticker from={askedAt} until={null} at={at} className="text-screen-ink" />
              </span>
            )}
            {state === "pick-in" && (
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-hire"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
