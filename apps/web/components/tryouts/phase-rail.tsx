import type { Phase } from "@/lib/board";
import { PHASES } from "@/lib/board";
import { cn } from "@/lib/utils";

export function PhaseRail({
  phase,
  probation,
  className,
}: {
  phase: Phase;
  probation: { done: number; of: number };
  className?: string;
}) {
  if (phase === "probation") {
    return (
      <span className={cn("caps text-screen-ink", className)}>
        Probation {probation.done}/{probation.of}
      </span>
    );
  }
  const current = PHASES.findIndex((p) => p.id === phase);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden className="flex gap-[3px]">
        {PHASES.map((p, i) => (
          <span
            key={p.id}
            className={cn(
              "h-1 w-3.5 rounded-[1px]",
              i < current ? "bg-screen-ink" : i === current ? "bg-hold" : "bg-screen-line",
            )}
          />
        ))}
      </span>
      <span className="caps w-[92px] text-screen-ink">
        <span className="sr-only">Phase: </span>
        {PHASES[current]?.label}
      </span>
    </span>
  );
}
