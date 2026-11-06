import type { TryoutRecord } from "@tryouts/kit/record";
import Link from "next/link";
import { Badge } from "@/components/geist";
import { dollars, duration, tokens } from "@/lib/format";
import { type Result, type Standing, standings, type Tone, vendorOf } from "@/lib/run";
import { cn } from "@/lib/utils";
import { CheckDots } from "./check-dots";

const RESULT: Record<Result, { label: string; tone: Tone }> = {
  verified: { label: "Verified", tone: "green" },
  failed: { label: "Failed", tone: "red" },
  checking: { label: "Checking", tone: "amber" },
  working: { label: "Working", tone: "gray" },
  "over-budget": { label: "Over budget", tone: "amber" },
};

function ResultBadge({ result }: { result: Result }) {
  const { label, tone } = RESULT[result];
  return <Badge tone={tone}>{label}</Badge>;
}

function Outcome({ s }: { s: Standing }) {
  if (s.candidate.outcome === "hired") return <Badge tone="blue">Hired</Badge>;
  if (s.candidate.outcome === "deleted") return <Badge>Deleted</Badge>;
  return <span className="text-gray-900">—</span>;
}

function Agent({ s }: { s: Standing }) {
  const c = s.candidate;
  const name = <span className="text-label-14 font-medium text-gray-1000">{c.agent}</span>;
  return (
    <span className="flex min-w-0 flex-col">
      {c.outcome === "hired" ? (
        <Link href={`/hires/${c.agent}`} className="hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}
      <span className="truncate text-label-13 text-gray-900" title={c.model ?? undefined}>
        {vendorOf(c)}
        {c.model ? ` · ${c.model.split("/").pop()}` : ""}
      </span>
    </span>
  );
}

const total = (s: Standing) =>
  s.candidate.tokens.input + s.candidate.tokens.cacheRead + s.candidate.tokens.cacheWrite;

const th = "h-10 px-4 font-medium whitespace-nowrap";
const td = "px-4 py-3 align-middle";

export function CandidatesTable({
  record,
  compact = false,
}: {
  record: TryoutRecord;
  compact?: boolean;
}) {
  const rows = standings(record);
  const reported = (s: Standing) => s.result !== "working" && s.result !== "checking";
  return (
    <>
      <div className={cn("overflow-x-auto max-sm:hidden", !compact && "card")}>
        <table className="w-full text-left text-label-14">
          <thead className="bg-background-200 text-gray-900">
            <tr className="border-b border-gray-alpha-400">
              {!compact && <th className={cn(th, "w-12 text-right")}>#</th>}
              <th className={th}>Agent</th>
              <th className={th}>Result</th>
              <th className={th}>Checks</th>
              {!compact && <th className={cn(th, "text-right")}>Time</th>}
              {!compact && <th className={cn(th, "text-right")}>Tokens in / out</th>}
              <th className={cn(th, "text-right")}>Est. cost</th>
              <th className={th}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.candidate.agent}
                className="border-b border-gray-alpha-400 last:border-0 hover:bg-gray-alpha-100"
              >
                {!compact && <td className={cn(td, "text-right text-gray-900")}>{s.rank}</td>}
                <td className={cn(td, "max-w-64")}>
                  <Agent s={s} />
                </td>
                <td className={td}>
                  <ResultBadge result={s.result} />
                </td>
                <td className={td}>
                  <span className="flex items-center gap-2">
                    <CheckDots checks={s.checks} />
                    <span className="text-label-13 text-gray-900 tabular-nums">
                      {s.candidate.report ? `${s.passed}/5` : ""}
                    </span>
                  </span>
                </td>
                {!compact && (
                  <td className={cn(td, "text-right tabular-nums")}>
                    {s.candidate.seconds !== null ? duration(s.candidate.seconds) : "—"}
                  </td>
                )}
                {!compact && (
                  <td className={cn(td, "text-right whitespace-nowrap tabular-nums")}>
                    {reported(s) ? (
                      <>
                        {tokens(total(s))}
                        <span className="text-gray-900"> / </span>
                        {tokens(s.candidate.tokens.output)}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className={cn(td, "text-right font-medium tabular-nums")}>
                  {reported(s) ? dollars(s.candidate.cost) : "—"}
                </td>
                <td className={td}>
                  <Outcome s={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={cn("sm:hidden", !compact && "card")}>
        {rows.map((s) => (
          <li
            key={s.candidate.agent}
            className="flex flex-col gap-2.5 border-b border-gray-alpha-400 p-4 last:border-0"
          >
            <div className="flex items-start justify-between gap-3">
              <Agent s={s} />
              <Outcome s={s} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <ResultBadge result={s.result} />
              <CheckDots checks={s.checks} />
              <span className="ml-auto text-label-14 font-medium tabular-nums">
                {reported(s) ? dollars(s.candidate.cost) : "—"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
