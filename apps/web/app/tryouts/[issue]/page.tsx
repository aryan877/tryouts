import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { Board } from "@/components/tryouts/board";
import { getRecord, listRecords } from "@/lib/records";

export async function generateStaticParams() {
  return (await listRecords()).map((record) => ({ issue: String(record.issue) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/tryouts/[issue]">): Promise<Metadata> {
  const { issue } = await params;
  const record = await getRecord(Number(issue));
  return { title: record ? `Tryout #${record.issue} · ${record.title}` : `Tryout #${issue}` };
}

export default async function TryoutPage({ params }: PageProps<"/tryouts/[issue]">) {
  const { issue } = await params;
  const record = await getRecord(Number(issue));
  if (!record) {
    const latest = (await listRecords())[0];
    return (
      <EmptyState
        title={`No tryout recorded for #${issue}.`}
        body="Boards are built from recorded runs. Nothing has been recorded for this issue yet."
        {...(latest
          ? { action: { href: `/tryouts/${latest.issue}`, label: "Watch the last one →" } }
          : {})}
      />
    );
  }
  return <Board record={record} />;
}
