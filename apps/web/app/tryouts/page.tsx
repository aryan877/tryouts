import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ArrowRight } from "@/components/icons";
import { Bib } from "@/components/tryouts/bib";
import { CheckLights } from "@/components/tryouts/check-lights";
import { finalFrame } from "@/lib/board";
import { day, plural } from "@/lib/format";
import { listRecords } from "@/lib/records";

export const metadata: Metadata = { title: "Tryouts" };

export default async function TryoutsPage() {
  const records = await listRecords();
  if (records.length === 0) {
    return (
      <EmptyState
        title="No tryouts recorded yet."
        body="When a hiring manager holds a tryout in Switch, its record shows up here: who tried out, what the referee found, and who got hired."
        action={{ href: "/", label: "See how it works" }}
      />
    );
  }
  return (
    <div className="container-page py-12">
      <h1 className="h1">Tryouts</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Newest first. Each one ends in a hire, or says why not.
      </p>
      <ol className="mt-8 flex flex-col gap-3">
        {records.map((record) => {
          const frame = finalFrame(record);
          return (
            <li key={record.issue}>
              <Link
                href={`/tryouts/${record.issue}`}
                className="panel group grid gap-4 p-5 transition-shadow hover:shadow-raised md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
              >
                <span className="min-w-0">
                  <span className="caps text-ink-3">
                    {record.source === "live" && !record.endedAt
                      ? "Live"
                      : `Recorded · ${day(record.startedAt)}`}
                  </span>
                  <span className="mt-1 block text-[20px] leading-[26px] font-[650]">
                    #{record.issue} · {record.title}
                  </span>
                  <span className="mt-1 block text-[13px] text-ink-3">
                    {plural(record.candidates.length, "candidate")} ·{" "}
                    {record.hire
                      ? `${record.hire.agent} hired as ${record.role}`
                      : `No hire for #${record.issue}`}
                  </span>
                </span>
                <span className="flex flex-col gap-1.5">
                  {frame.lanes.map((lane) => (
                    <span key={lane.candidate.agent} className="flex items-center gap-2.5">
                      <Bib n={lane.candidate.bib} size={20} />
                      <span className="mono w-28 truncate text-[12px]">{lane.candidate.agent}</span>
                      <CheckLights lights={lane.lights} size={12} />
                    </span>
                  ))}
                </span>
                <ArrowRight className="hidden size-5 text-ink-3 transition-transform group-hover:translate-x-0.5 md:block" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
