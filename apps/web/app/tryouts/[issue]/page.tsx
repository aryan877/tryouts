import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Badge, Section } from "@/components/geist";
import { ArrowUpRight } from "@/components/icons";
import { CandidatesTable } from "@/components/run/candidates-table";
import { LiveRefresh } from "@/components/run/live-refresh";
import { Messages } from "@/components/run/messages";
import { Summary } from "@/components/run/summary";
import { Timeline } from "@/components/run/timeline";
import { Button } from "@/components/ui/button";
import { hexOf } from "@/lib/format";
import { getRecord, listRecords } from "@/lib/records";
import { statusOf } from "@/lib/run";
import { issueUrl } from "@/lib/site";

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
        body="This page is built from a recorded run, and nothing has been recorded for this issue yet."
        {...(latest
          ? { action: { href: `/tryouts/${latest.issue}`, label: `Open tryout #${latest.issue}` } }
          : {})}
      />
    );
  }
  const status = statusOf(record);
  const github = issueUrl(record.repository, record.issue);
  const digest = record.hire?.digest;
  return (
    <>
      {status.live && <LiveRefresh />}
      <div className="border-b border-gray-alpha-400 bg-background-100">
        <div className="container-page pt-8 pb-10">
          <nav aria-label="Breadcrumb" className="text-label-14 text-gray-900">
            <Link href="/tryouts" className="hover:text-gray-1000">
              Tryouts
            </Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-1000">#{record.issue}</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-heading-32">Tryout #{record.issue}</h1>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="mt-1 text-copy-16 text-gray-900">{record.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {github && (
                <Button asChild variant="secondary">
                  <a href={github} target="_blank" rel="noreferrer">
                    Issue #{record.issue} on GitHub
                    <ArrowUpRight className="text-gray-900" />
                  </a>
                </Button>
              )}
              {digest && (
                <Button asChild variant="secondary">
                  <Link href={`/verify/${hexOf(digest)}`}>Check it yourself</Link>
                </Button>
              )}
              {record.hire && (
                <Button asChild>
                  <Link href={`/hires/${record.hire.agent}`}>View the hire</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mt-8">
            <Summary record={record} />
          </div>
        </div>
      </div>
      <div className="container-page flex flex-col gap-12 py-12">
        <Section
          id="candidates"
          title="Candidates"
          description={`Same bug, same 5 checks for everyone. ${record.rule}`}
        >
          <CandidatesTable record={record} />
        </Section>
        <Section
          id="timeline"
          title="Timeline"
          description="Every step from the job post to the hire's first real fix. Times are UTC."
        >
          <Timeline record={record} />
        </Section>
        <Messages record={record} />
      </div>
    </>
  );
}
