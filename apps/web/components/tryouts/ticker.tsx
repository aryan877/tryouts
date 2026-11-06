"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { elapsed } from "@/lib/format";

const TimeContext = createContext<(() => number) | null>(null);
export const TimeProvider = TimeContext.Provider;

export function Ticker({
  from,
  until,
  at,
  className,
}: {
  from: number;
  until: number | null;
  at: number;
  className?: string;
}) {
  const now = useContext(TimeContext);
  const ref = useRef<HTMLSpanElement>(null);
  const stop = until ?? Number.POSITIVE_INFINITY;
  const text = elapsed(Math.max(0, Math.min(at, stop) - from) / 1000);
  useEffect(() => {
    if (!now) {
      const node = ref.current?.firstChild;
      if (node) node.nodeValue = text;
      return;
    }
    let frame = 0;
    const tick = () => {
      const node = ref.current?.firstChild;
      const value = elapsed(Math.max(0, Math.min(now(), stop) - from) / 1000);
      if (node && node.nodeValue !== value) node.nodeValue = value;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [now, from, stop, text]);
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
