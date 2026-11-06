import { day, dollars } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Rolling } from "./rolling";
import { Tip } from "./tip";

export function CostTicker({
  value,
  asOf,
  className,
  rollFrom,
}: {
  value: number | null;
  asOf: string;
  className?: string;
  rollFrom?: boolean;
}) {
  if (value === null) return <span className={cn("num text-ink-3", className)}>—</span>;
  const text = dollars(value);
  return (
    <Tip
      label={`Tokens from Switch × list price on ${day(asOf)}. Subscriptions may cost less.`}
      className="inline-flex items-baseline gap-1"
    >
      <Rolling
        text={text}
        {...(rollFrom ? { from: text.replace(/\d/g, "0"), stagger: "left" as const } : {})}
        className={className}
      />
      <span className="text-[11px] leading-none font-medium text-ink-3">est.</span>
    </Tip>
  );
}
