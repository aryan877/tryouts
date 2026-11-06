"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Commit, Crown, Door } from "@/components/icons";
import { CHIP, type LaneStatus } from "@/lib/board";
import { cn } from "@/lib/utils";

const STYLE: Record<LaneStatus, string> = {
  drawn: "shadow-[inset_0_0_0_1px_var(--line-strong)] text-ink-2",
  working: "bg-surface-2 text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]",
  ready: "shadow-[inset_0_0_0_1px_var(--line-strong)] text-ink",
  checking: "bg-hold text-[#0c0d10]",
  verified: "bg-go text-[#0c0d10]",
  refuted: "bg-stop text-on-stop",
  "over-budget": "bg-stop-tint hatch-stop text-stop-ink",
  recommended: "outline-1 outline-dashed outline-hold -outline-offset-1 text-hold-ink",
  hired: "bg-hire text-[#0c0d10]",
  dismissing: "bg-surface-2 text-ink-3",
  dismissed: "bg-surface-2 text-ink-3",
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.55, 0, 1, 0.45] as const;

export function StatusChip({
  status,
  label,
  className,
}: {
  status: LaneStatus;
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const flip = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { rotateX: -90 },
        animate: { rotateX: 0, transition: { duration: 0.12, ease: EASE_OUT } },
        exit: { rotateX: 90, transition: { duration: 0.09, ease: EASE_IN } },
      };
  return (
    <span className={cn("inline-flex h-6 perspective-[400px]", className)}>
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={status}
          {...flip}
          {...(reduce ? { transition: { duration: 0.12 } } : {})}
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-chip px-2 text-[12px] leading-none font-bold tracking-[0.04em] whitespace-nowrap wdth-85 backface-hidden",
            STYLE[status],
          )}
        >
          {status === "working" && (
            <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-ink-3" />
          )}
          {status === "ready" && <Commit className="size-3.5" />}
          {status === "hired" && <Crown className="size-3.5" />}
          {(status === "dismissing" || status === "dismissed") && <Door className="size-3.5" />}
          {label ?? CHIP[status]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
