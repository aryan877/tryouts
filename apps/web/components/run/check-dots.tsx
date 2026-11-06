import { StatusDot } from "@/components/geist";
import { Tip } from "@/components/tip";
import { CHECKS } from "@/lib/run";

const STATE = (value: boolean | null) =>
  value === null ? "not run yet" : value ? "passed" : "failed";

export function CheckDots({ checks }: { checks: (boolean | null)[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {CHECKS.map((check, i) => {
        const value = checks[i] ?? null;
        return (
          <Tip key={check.id} label={`${check.label}: ${STATE(value)}`} className="p-[3px]">
            <StatusDot tone={value === null ? "gray" : value ? "green" : "red"} />
            <span className="sr-only">{`${check.label}: ${STATE(value)}`}</span>
          </Tip>
        );
      })}
    </span>
  );
}
