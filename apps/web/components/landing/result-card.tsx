import type { TryoutRecord } from "@tryouts/kit/record";
import Link from "next/link";
import { AppName } from "@/components/app-glyph";
import { Badge, ExternalLink } from "@/components/geist";
import { ArrowRight, Commit, GitHub, IssueIcon } from "@/components/icons";
import { CandidatesTable } from "@/components/run/candidates-table";
import { day, duration, sha7 } from "@/lib/format";
import { appOf, secondsOf, standings, statusOf } from "@/lib/run";
import { commitUrl, issueUrl, repoName } from "@/lib/site";

export function ResultCard({ record }: { record: TryoutRecord }) {
  const status = statusOf(record);
  const hire = record.hire;
  const fix = record.probation.fixes[0];
  const repo = repoName(record.repository);
  const verified = standings(record).filter((s) => s.result === "verified").length;
  return (
    <article className="card overflow-hidden text-left shadow-border-medium">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-gray-alpha-400 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-heading-16">
              Tryout #{record.issue} · {record.title}
            </h3>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-label-14 text-gray-900">
            {repo ?? record.repository} · {day(record.posted.at)} · {duration(secondsOf(record))} ·{" "}
            {verified} of {record.candidates.length} passed the referee
          </p>
        </div>
        <Link
          href={`/tryouts/${record.issue}`}
          className="inline-flex items-center gap-1.5 text-label-14 font-medium text-gray-1000 hover:underline"
        >
          Open the run <ArrowRight />
        </Link>
      </header>
      <CandidatesTable record={record} compact />
      {hire && (
        <footer className="flex flex-col gap-3 border-t border-gray-alpha-400 bg-background-200 px-5 py-4">
          <p className="text-copy-14 text-gray-900">
            <strong>{hire.agent}</strong> was hired as @{record.role}.{" "}
            <strong>{hire.approval.answeredBy}</strong> approved it with “{hire.approval.answer}” in{" "}
            <AppName app={appOf(record, hire.approval.room)} className="text-gray-1000" />. Its fix
            merged into main{repo ? ` and closed issue #${hire.issue}` : ""}.
            {fix &&
              ` Its first real job, issue #${fix.issue}, was checked and merged too. Probation: ${record.probation.fixes.length} of ${record.probation.of}.`}
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-label-14 text-gray-1000">
            {repo && (
              <ExternalLink
                href={`https://github.com/${repo}`}
                icon={<GitHub className="size-3.5" />}
              >
                {repo}
              </ExternalLink>
            )}
            <ExternalLink
              href={issueUrl(record.repository, hire.issue)}
              icon={<IssueIcon className="size-3.5 text-gray-900" />}
            >
              Issue #{hire.issue}
            </ExternalLink>
            <ExternalLink
              href={commitUrl(record.repository, hire.merged)}
              icon={<Commit className="size-3.5 text-gray-900" />}
            >
              Merge <span className="font-mono text-[13px]">{sha7(hire.merged)}</span>
            </ExternalLink>
            {fix && (
              <ExternalLink
                href={issueUrl(record.repository, fix.issue)}
                icon={<IssueIcon className="size-3.5 text-gray-900" />}
              >
                Issue #{fix.issue}
              </ExternalLink>
            )}
          </p>
        </footer>
      )}
    </article>
  );
}
