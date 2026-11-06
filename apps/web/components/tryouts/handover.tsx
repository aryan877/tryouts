import { AGENTS, ALIAS } from "@tryouts/kit";
import type { TryoutRecord } from "@tryouts/kit/record";
import { appOf, roomOf } from "@/lib/board";
import { clock, ms, sha7 } from "@/lib/format";
import { commitUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AppGlyph } from "./app-glyph";
import { ProbationTracker } from "./probation-tracker";

interface Step {
  key: string;
  at: string;
  title: string;
  feature: string;
  body: React.ReactNode;
}

const Cmd = ({ children }: { children: string }) => (
  <code className="mono rounded-[3px] bg-sunken px-1.5 py-0.5 text-[12px] text-ink">
    {children}
  </code>
);

export function Handover({
  record,
  at,
  className,
}: {
  record: TryoutRecord;
  at: number;
  className?: string;
}) {
  const hire = record.hire;
  if (!hire) return null;
  const bugs = record.admitted ? roomOf(record, record.admitted.room) : undefined;
  const merged = commitUrl(record.repository, hire.merged);
  const steps: Step[] = [
    {
      key: "merge",
      at: hire.at,
      title: "The verified commit merged",
      feature: "Owner-only approval",
      body: (
        <>
          <span className="mono">{sha7(hire.sha)}</span> merged into main as{" "}
          {merged ? (
            <a
              href={merged}
              className="mono underline decoration-line-strong underline-offset-2 hover:decoration-ink"
            >
              {sha7(hire.merged)}
            </a>
          ) : (
            <span className="mono">{sha7(hire.merged)}</span>
          )}
          , with the hire record in the commit.
        </>
      ),
    },
    ...(record.refusal
      ? [
          {
            key: "refusal",
            at: record.refusal.at,
            title: `Switch refused ${AGENTS.hiring.name}'s invite to #${bugs?.name ?? "bugs"}`,
            feature: "Room ownership",
            body: (
              <>
                {bugs
                  ? `#${bugs.name} is ${bugs.owner}'s room, so a person in it has to let the hire in. `
                  : ""}
                <span className="text-ink-3">“{record.refusal.text}”</span>
              </>
            ),
          },
        ]
      : []),
    ...(record.admitted
      ? [
          {
            key: "admitted",
            at: record.admitted.at,
            title: `${record.admitted.by} let it in as @${ALIAS}`,
            feature: "Aliases · second app",
            body: (
              <span className="flex flex-wrap items-center gap-1.5">
                {record.admitted.commands.map((command) => (
                  <Cmd key={command}>{command}</Cmd>
                ))}
                <span className="inline-flex items-center gap-1 text-ink-3">
                  in #{record.admitted.room}
                  <AppGlyph app={appOf(record, record.admitted.room)} className="size-3" />
                </span>
              </span>
            ),
          },
        ]
      : []),
    ...(record.deletions.length > 0
      ? [
          {
            key: "deletions",
            at: record.deletions.at(-1)?.at ?? hire.at,
            title: `${record.deletions[0]?.confirmedBy} confirmed each dismissal`,
            feature: "Owner-confirmed deletion",
            body: (
              <span className="flex flex-wrap gap-1.5">
                {record.deletions.map((d) => (
                  <Cmd key={d.agent}>{`!delete-agent ${d.agent} confirm`}</Cmd>
                ))}
              </span>
            ),
          },
        ]
      : []),
  ].sort((a, b) => ms(a.at) - ms(b.at));

  return (
    <section aria-labelledby="handover-title" className={cn("panel", className)}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <h2 id="handover-title" className="caps text-ink">
          After the hire
        </h2>
        <span className="ml-auto text-[12px] text-ink-3">Two owners, two apps, two keys</span>
      </header>
      <ol className="px-4 py-1">
        {steps.map((step) => {
          const done = ms(step.at) <= at;
          return (
            <li
              key={step.key}
              className={cn(
                "grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 border-b border-line py-3 transition-opacity duration-300",
                !done && "opacity-35",
              )}
            >
              <time dateTime={step.at} className="mono pt-0.5 text-[12px] text-ink-3">
                {done ? clock(step.at) : "—"}
              </time>
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2 text-[14px] leading-5 font-semibold">
                  {step.title}
                  <span className="caps text-[10px] text-ink-3">Switch: {step.feature}</span>
                </p>
                <div className="mt-1 text-[13px] leading-[19px] text-ink-2">{step.body}</div>
              </div>
            </li>
          );
        })}
        <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 py-3">
          <span className="caps pt-0.5 text-ink-3">Next</span>
          <ProbationTracker record={record} at={at} />
        </li>
      </ol>
    </section>
  );
}
