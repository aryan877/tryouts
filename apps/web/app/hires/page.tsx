import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/geist";
import { ChevronRight } from "@/components/icons";
import { day } from "@/lib/format";
import { listRecords } from "@/lib/records";
import { appName, hiredOf, ownerOf, vendorOf } from "@/lib/run";

export const metadata: Metadata = { title: "Hires" };

export default async function HiresPage() {
  const hires = (await listRecords()).filter((record) => record.hire);
  if (hires.length === 0) {
    return (
      <EmptyState
        title="No hires yet."
        body="A hire shows up here only after the team lead approves it in Switch."
        action={{ href: "/tryouts", label: "See the tryouts" }}
      />
    );
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-heading-32">Hires</h1>
      <p className="mt-1 text-copy-16 text-gray-900">
        Every hire passed the referee's checks and was approved by its owner.
      </p>
      <ul className="card mt-8">
        {hires.map((record) => {
          const hire = record.hire;
          const c = hiredOf(record);
          if (!hire || !c) return null;
          return (
            <li key={record.issue} className="border-b border-gray-alpha-400 last:border-0">
              <Link
                href={`/hires/${hire.agent}`}
                className="grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-alpha-100 md:grid-cols-[minmax(0,1fr)_auto_200px_20px]"
              >
                <span className="min-w-0">
                  <span className="block text-label-14 font-medium">{hire.agent}</span>
                  <span className="mt-1 block truncate text-label-14 text-gray-900">
                    {vendorOf(c)} · from tryout #{record.issue}
                  </span>
                </span>
                <Badge tone="blue">@{record.role}</Badge>
                <span className="text-label-14 text-gray-900">
                  Approved by {ownerOf(record)} in {appName(record, hire.approval.room)}
                  <span className="block">
                    {day(hire.at)} · probation{" "}
                    {Math.min(record.probation.fixes.length, record.probation.of)} of{" "}
                    {record.probation.of}
                  </span>
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
