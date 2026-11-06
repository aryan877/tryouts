import type { TryoutRecord } from "@tryouts/kit/record";
import { day, ms, shortClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tip } from "./tip";

export function ProbationTracker({
  record,
  at,
  className,
}: {
  record: TryoutRecord;
  at?: number;
  className?: string;
}) {
  const of = record.probation.of;
  const fixes = record.probation.fixes.filter((fix) => at === undefined || ms(fix.at) <= at);
  const passed = fixes.length >= of;
  const owner = record.hire?.approval.answeredBy ?? record.posted.by;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <span className="flex gap-1.5">
          {Array.from({ length: of }, (_, i) => {
            const fix = fixes[i];
            return fix ? (
              <Tip
                key={fix.issue}
                label={`#${fix.issue} · verified · merged ${shortClock(fix.at)} · ${fix.approval.answeredBy ?? owner}'s card`}
              >
                <span className="block size-3.5 rounded-[2px] bg-go" />
              </Tip>
            ) : (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: empty slots are positional
                key={i}
                aria-hidden
                className="block size-3.5 rounded-[2px] shadow-[inset_0_0_0_1.5px_var(--line-strong)]"
              />
            );
          })}
        </span>
        <span className={cn("caps", passed ? "text-go-ink" : "text-ink-2")}>
          {passed ? `Probation passed · ${of} of ${of}` : `Probation ${fixes.length} of ${of}`}
        </span>
      </div>
      {fixes.length > 0 && (
        <ul className="text-[13px] leading-[18px] text-ink-2">
          {fixes.map((fix) => (
            <li key={fix.issue}>
              #{fix.issue} {fix.title} · reported by {fix.reportedBy} in #{fix.room} · fixed,
              verified, merged {day(fix.at, false)} {shortClock(fix.at)}
            </li>
          ))}
        </ul>
      )}
      {fixes.length > of && (
        <span
          role="img"
          className="flex gap-[3px]"
          aria-label={`${fixes.length - of} more fixes after probation`}
        >
          {fixes.slice(of).map((fix) => (
            <span
              key={fix.issue}
              className="size-2.5 rounded-[2px] bg-go"
              title={`Fixed #${fix.issue} · verified · ${day(fix.at, false)}`}
            />
          ))}
        </span>
      )}
    </div>
  );
}
