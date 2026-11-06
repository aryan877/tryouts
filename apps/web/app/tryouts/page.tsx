import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { StatusDot } from "@/components/geist";
import { ChevronRight } from "@/components/icons";
import { day, duration } from "@/lib/format";
import { listRecords } from "@/lib/records";
import { secondsOf, standings, statusOf } from "@/lib/run";
import { repoName } from "@/lib/site";

export const metadata: Metadata = { title: "Tryouts" };

export default async function TryoutsPage() {
  const records = await listRecords();
  if (records.length === 0) {
    return (
      <EmptyState
        title="No tryouts recorded yet."
        body="When the hiring manager holds a tryout in Switch, its record shows up here: who tried out, what the referee found, and who got hired."
        action={{ href: "/", label: "See how it works" }}
      />
    );
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-heading-32">Tryouts</h1>
      <p className="mt-1 text-copy-16 text-gray-900">
        Newest first. Each one ends in a hire, or says why not.
      </p>
      <ul className="card mt-8">
        {records.map((record) => {
          const status = statusOf(record);
          const verified = standings(record).filter((s) => s.result === "verified").length;
          return (
            <li key={record.issue} className="border-b border-gray-alpha-400 last:border-0">
              <Link
                href={`/tryouts/${record.issue}`}
                className="group grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-alpha-100 md:grid-cols-[minmax(0,1fr)_140px_200px_20px]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-label-14 font-medium">
                    Tryout #{record.issue} · {record.title}
                  </span>
                  <span className="mt-1 block truncate text-label-14 text-gray-900">
                    {repoName(record.repository) ?? record.repository} ·{" "}
                    {record.hire ? `${record.hire.agent} hired` : "nobody hired"}
                  </span>
                </span>
                <StatusDot tone={status.tone} label={status.label} pulse={status.live} />
                <span className="text-label-14 text-gray-900">
                  {verified} of {record.candidates.length} passed · {duration(secondsOf(record))}
                  <span className="block">{day(record.posted.at)}</span>
                </span>
                <ChevronRight className="text-gray-900 max-md:hidden" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
