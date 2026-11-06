"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { CHECKS, type LightState } from "@/lib/board";
import { cn } from "@/lib/utils";

const FILL: Record<LightState, string> = {
  off: "#1a1d22",
  checking: "#ffb224",
  pass: "#30d158",
  fail: "#ff453a",
  start: "#ff453a",
};
const AMBER = "#ffb224";

const SIZES = {
  12: { light: 12, gap: 6, pad: "px-1.5 py-1", radius: 6, glyph: 6 },
  16: { light: 16, gap: 8, pad: "px-2 py-1.5", radius: 7, glyph: 8 },
  20: { light: 20, gap: 12, pad: "px-3 py-2", radius: 8, glyph: 9 },
  28: { light: 28, gap: 14, pad: "px-3.5 py-2.5", radius: 10, glyph: 12 },
} as const;

const final = (state: LightState | undefined) => state === "pass" || state === "fail";

const WORD: Record<LightState, string> = {
  off: "not checked yet",
  checking: "checking",
  pass: "passed",
  fail: "failed",
  start: "not checked yet",
};

function Glyph({ state, size }: { state: LightState; size: number }) {
  if (!final(state)) return null;
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} aria-hidden className="text-[#0c0d10]">
      {state === "pass" ? (
        <path d="M1.6 5.3 4 7.6 8.5 2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      ) : (
        <path
          d="M2.2 2.2 7.8 7.8M7.8 2.2 2.2 7.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      )}
    </svg>
  );
}

export function CheckLights({
  lights,
  size = 20,
  labels = false,
  lightsOut = null,
  className,
}: {
  lights: LightState[];
  size?: keyof typeof SIZES;
  labels?: boolean;
  lightsOut?: number | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const spec = SIZES[size];
  const shown: LightState[] =
    lightsOut === null ? lights : CHECKS.map((_, i) => (i < lightsOut ? "start" : "off"));
  const previous = useRef(shown);
  useEffect(() => {
    previous.current = shown;
  });
  const summary = shown.every((s) => s === "pass")
    ? "All 5 checks passed"
    : shown.some(final)
      ? `${shown.filter((s) => s === "pass").length} of 5 checks passed`
      : shown.includes("checking")
        ? "Referee is checking"
        : "Not checked yet";

  return (
    <span
      role="img"
      aria-label={`${summary}. ${shown.map((s, i) => `${CHECKS[i]?.title}: ${WORD[s]}`).join(". ")}.`}
      className={cn(
        "inline-flex flex-col items-center rounded-control bg-screen",
        spec.pad,
        className,
      )}
      style={{ borderRadius: spec.radius }}
    >
      <span className="flex items-center" style={{ gap: spec.gap }}>
        {shown.map((state, i) => {
          const check = CHECKS[i];
          const resolving = !reduce && final(state) && !final(previous.current[i]);
          const scanning = state === "checking" && !reduce;
          const color = scanning ? FILL.off : FILL[state];
          return (
            <motion.span
              key={check?.id ?? i}
              aria-hidden
              initial={false}
              animate={{
                backgroundColor: resolving ? [AMBER, AMBER, color] : color,
                scale: resolving ? [1, 1.18, 1] : 1,
              }}
              transition={
                resolving
                  ? { delay: i * 0.14, duration: 0.3, times: [0, 0.2, 1] }
                  : { duration: 0.08 }
              }
              className="grid shrink-0 place-items-center rounded-full"
              style={{
                width: spec.light,
                height: spec.light,
                boxShadow: state === "off" ? "inset 0 0 0 1px #3a3f48" : undefined,
                animation: scanning ? `scan 600ms steps(1, end) ${i * 120}ms infinite` : undefined,
              }}
            >
              <motion.span
                initial={false}
                animate={{ opacity: final(state) ? 1 : 0 }}
                transition={{ delay: resolving ? i * 0.14 + 0.06 : 0, duration: 0.08 }}
                className="grid place-items-center"
              >
                <Glyph state={state} size={spec.glyph} />
              </motion.span>
            </motion.span>
          );
        })}
      </span>
      {labels && <LightLabels gap={spec.gap} width={spec.light} className="mt-1.5" screen />}
    </span>
  );
}

export function LightLabels({
  gap = 12,
  width = 20,
  className,
  screen = false,
}: {
  gap?: number;
  width?: number;
  className?: string;
  screen?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn("flex items-center", screen ? "text-screen-ink-3" : "text-ink-3", className)}
      style={{ gap }}
    >
      {CHECKS.map((check) => (
        <span
          key={check.id}
          className="text-center text-[9px] leading-none font-[650] tracking-[0.06em] uppercase wdth-75"
          style={{ width }}
        >
          {check.label}
        </span>
      ))}
    </span>
  );
}
