"use client";

import type { Candidate } from "@tryouts/kit/record";
import { useEffect, useRef, useState } from "react";
import { tokens } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tip } from "./tip";

export function BudgetMeter({
  budget,
  className,
  compact = false,
}: {
  budget: Candidate["budget"];
  className?: string;
  compact?: boolean;
}) {
  const previous = useRef(budget?.spent ?? null);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    const spent = budget?.spent ?? null;
    if (previous.current !== null && spent !== null && spent > previous.current) {
      setDelta(spent - previous.current);
      const timer = setTimeout(() => setDelta(null), 1200);
      previous.current = spent;
      return () => clearTimeout(timer);
    }
    previous.current = spent;
  }, [budget?.spent]);

  if (!budget) {
    return (
      <span className={cn("block text-[12px] leading-4 text-ink-3", className)}>
        Usage updates when a turn ends.
      </span>
    );
  }
  const share = budget.limit > 0 ? Math.min(1, budget.spent / budget.limit) : 0;
  const tone = budget.exhausted || share >= 1 ? "stop" : share >= 0.8 ? "hold" : "ink";
  return (
    <Tip
      label="Switch usage budget on output tokens, per agent. Updates when a turn ends."
      className={cn("block w-full", className)}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="mono text-[13px] leading-[18px] text-ink">
          {tokens(budget.spent)} <span className="text-ink-3">/ {tokens(budget.limit)}</span>
        </span>
        <span
          aria-hidden
          className={cn(
            "mono text-[11px] text-ink-2 transition-opacity duration-300",
            delta ? "opacity-100" : "opacity-0",
          )}
        >
          +{tokens(delta ?? 0)}
        </span>
      </span>
      <span className="relative mt-1 block h-2 overflow-hidden rounded-[4px] bg-sunken">
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-full origin-left transition-transform duration-[360ms] ease-out",
            tone === "stop" ? "bg-stop hatch-stop" : tone === "hold" ? "bg-hold" : "bg-ink-2",
          )}
          style={{ transform: `scaleX(${share})` }}
        />
        {[0.5, 0.8].map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute inset-y-0 w-px bg-page/70"
            style={{ left: `${tick * 100}%` }}
          />
        ))}
      </span>
      {!compact && (
        <span
          className={cn(
            "mt-1 block text-[11px] leading-[14px]",
            tone === "stop" ? "text-stop-ink" : tone === "hold" ? "text-hold-ink" : "text-ink-3",
          )}
        >
          {budget.exhausted
            ? `Switch stopped it at ${tokens(budget.limit)}`
            : `output tokens · ${Math.round(share * 100)}% · as of last turn`}
        </span>
      )}
    </Tip>
  );
}
