import type { Candidate, TryoutRecord } from "@tryouts/kit/record";
import { LogoMark } from "@/components/logo";
import { appOf, checkOf, type LightState, lightsOf, ownerOf, vendorOf } from "@/lib/board";
import { diff, dollars, elapsed, tokens } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bib } from "./bib";
import { CheckLights } from "./check-lights";
import { HiredStamp } from "./hired-stamp";
import { Rolling } from "./rolling";

type CardVariant = "hired" | "verified" | "refuted" | "over-budget" | "dismissed";

function variantOf(record: TryoutRecord, c: Candidate): CardVariant {
  if (record.hire?.agent === c.agent) return "hired";
  if (c.report?.verdict === "verified") return "verified";
  if (c.report?.verdict === "refuted") return "refuted";
  return c.budget?.exhausted ? "over-budget" : "dismissed";
}

const total = (c: Candidate) =>
  c.tokens.input + c.tokens.output + c.tokens.cacheRead + c.tokens.cacheWrite;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="caps text-[10px] text-screen-ink-3">{label}</p>
      <p className="num mt-1 text-[17px] leading-none font-[650] text-screen-ink wdth-85">
        {value}
      </p>
    </div>
  );
}

export function CardFace({
  record,
  candidate: c,
  roll = false,
  stamp,
  lights,
}: {
  record: TryoutRecord;
  candidate: Candidate;
  roll?: boolean;
  stamp?: React.ReactNode;
  lights?: LightState[];
}) {
  const variant = variantOf(record, c);
  const verified = c.report?.verdict === "verified";
  const failed = c.report?.checks.find((check) => !check.passed);
  const hire = record.hire;
  return (
    <div className="screen relative flex size-full flex-col overflow-hidden rounded-[10px] p-5">
      <div className="flex items-start gap-3">
        <Bib n={c.bib} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] leading-6 font-[750]">{c.agent}</p>
          <p className="truncate text-[12px] leading-4 text-screen-ink-2">
            {vendorOf(c)} ·{" "}
            {c.model ? <span className="mono">{c.model}</span> : "model not reported"}
          </p>
        </div>
        <span className="caps shrink-0 pt-1 text-screen-ink-3">Tryout #{record.issue}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pt-2 text-center">
        {verified ? (
          <>
            <p className="text-[88px] leading-[0.9] font-[850] tracking-[-0.02em] wdth-62">
              {roll ? (
                <Rolling
                  text={dollars(c.cost)}
                  from={dollars(c.cost).replace(/\d/g, "0")}
                  stagger="left"
                />
              ) : (
                <span className="num">{dollars(c.cost)}</span>
              )}
            </p>
            <p className="caps mt-2 text-screen-ink-2">Cost per verified fix · est.</p>
            {variant === "hired" && hire && (
              <div className="mt-3 grid h-[60px] place-items-center">
                {stamp === undefined ? (
                  <HiredStamp
                    role={record.role}
                    date={hire.approval.answeredAt ?? hire.at}
                    approver={ownerOf(record)}
                    app={appOf(record, hire.approval.room)}
                    size="card"
                    className="-rotate-3"
                  />
                ) : (
                  stamp
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-[13px] font-bold tracking-[0.06em] text-stop-ink uppercase wdth-85">
              {variant === "over-budget" ? "Over budget" : "Refuted"}
            </p>
            <p className="mt-2 max-w-[240px] text-[20px] leading-6 font-[650]">
              {failed
                ? checkOf(failed.id).long
                : `Switch stopped it at ${tokens(c.budget?.limit ?? 0)}`}
            </p>
            <p className="mt-2 text-[12px] text-screen-ink-3">{dollars(c.cost)} spent · est.</p>
          </>
        )}
      </div>

      <div className="flex justify-center">
        <CheckLights lights={lights ?? lightsOf(c)} size={20} labels />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-screen-line pt-4">
        <Stat label="Time" value={c.seconds !== null ? elapsed(c.seconds) : "—"} />
        <Stat label="Lines" value={c.diff ? diff(c.diff) : "—"} />
        <Stat label="Tokens" value={tokens(total(c))} />
        <Stat
          label="Budget"
          value={
            c.budget
              ? `${Math.round((c.budget.spent / c.budget.limit) * 100)}% of ${tokens(c.budget.limit)}`
              : "—"
          }
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="caps text-screen-ink-3">
          {variant === "hired"
            ? `1 of ${record.candidates.length} candidates`
            : `Bib ${c.bib} · ${record.candidates.length} candidates`}
        </span>
        <LogoMark size={18} />
      </div>
    </div>
  );
}

export function CardBack({ candidate: c }: { candidate: Candidate }) {
  return (
    <div className="screen flex size-full flex-col items-center justify-center gap-6 rounded-[10px]">
      <span
        className="num text-[220px] leading-none font-[850] text-transparent wdth-62"
        style={{ WebkitTextStroke: "2px var(--screen-ink-3)" }}
        aria-hidden
      >
        {c.bib}
      </span>
      <span className="flex gap-2" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="size-2.5 rounded-full bg-[#30d158]" />
        ))}
      </span>
    </div>
  );
}

export function AgentCard({
  record,
  candidate,
  size = "lg",
  className,
}: {
  record: TryoutRecord;
  candidate: Candidate;
  size?: "lg" | "md";
  className?: string;
}) {
  const hired = record.hire?.agent === candidate.agent;
  const frame = (
    <div
      className={cn(
        "h-[504px] w-[360px] rounded-card",
        hired ? "foil p-1.5" : "bg-screen-line p-px",
        size === "md" && "origin-top-left scale-[0.6667]",
      )}
    >
      <CardFace record={record} candidate={candidate} />
    </div>
  );
  if (size === "lg") return <div className={className}>{frame}</div>;
  return <div className={cn("h-[336px] w-[240px] shrink-0", className)}>{frame}</div>;
}
