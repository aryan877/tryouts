import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { AgentCard } from "@/components/tryouts/agent-card";
import { day } from "@/lib/format";
import { listRecords } from "@/lib/records";

export const metadata: Metadata = { title: "Hire records" };

export default async function HiresPage() {
  const hires = (await listRecords()).filter((record) => record.hire);
  if (hires.length === 0) {
    return (
      <EmptyState
        title="No hire records yet."
        body="A hire record exists only after an owner approves a hire in Switch."
        action={{ href: "/tryouts", label: "See the tryouts" }}
      />
    );
  }
  return (
    <div className="container-page py-12">
      <h1 className="h1">Hire records</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Each hire was verified by plain code and approved by its owner.
      </p>
      <ul className="mt-8 flex flex-wrap gap-8">
        {hires.map((record) => {
          const hire = record.hire;
          const c = record.candidates.find((x) => x.agent === hire?.agent);
          if (!hire || !c) return null;
          return (
            <li key={record.issue}>
              <Link
                href={`/hires/${hire.agent}`}
                className="group flex flex-col gap-3 rounded-card"
              >
                <AgentCard
                  record={record}
                  candidate={c}
                  size="md"
                  className="transition-transform duration-200 group-hover:-translate-y-0.5"
                />
                <span className="text-[14px] font-semibold">
                  {hire.agent} · {record.role}
                  <span className="block text-[13px] font-normal text-ink-3">
                    Tryout #{record.issue} · {day(hire.at)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
