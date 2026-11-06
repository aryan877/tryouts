import type { TryoutRecord } from "@tryouts/kit/record";
import Link from "next/link";
import { AppName } from "@/components/app-glyph";
import { ExternalLink, StatusDot } from "@/components/geist";
import { Commit, GitHub, IssueIcon } from "@/components/icons";
import { duration, sha7, when } from "@/lib/format";
import { appOf, hiredOf, secondsOf, statusOf, vendorOf } from "@/lib/run";
import { commitUrl, issueUrl, repoName } from "@/lib/site";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-label-14 text-gray-900">{label}</dt>
      <dd className="min-w-0 text-label-14 text-gray-1000">{children}</dd>
    </div>
  );
}

export function Summary({ record }: { record: TryoutRecord }) {
  const status = statusOf(record);
  const hire = record.hire;
  const hired = hiredOf(record);
  const repo = repoName(record.repository);
  return (
    <dl className="card grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Status">
        <StatusDot tone={status.tone} label={status.label} pulse={status.live} />
      </Field>
      <Field label="Hired">
        {hired ? (
          <Link href={`/hires/${hired.agent}`} className="font-medium hover:underline">
            {hired.agent}
            <span className="font-normal text-gray-900"> · {vendorOf(hired)}</span>
          </Link>
        ) : (
          <span className="text-gray-900">Nobody yet</span>
        )}
      </Field>
      <Field label="Approved by">
        {hire?.approval.answeredBy ? (
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            {hire.approval.answeredBy}
            <span className="text-gray-900">· {hire.approval.answer} ·</span>
            <AppName app={appOf(record, hire.approval.room)} />
          </span>
        ) : (
          <span className="text-gray-900">Waiting for the team lead</span>
        )}
      </Field>
      <Field label="Started">
        {when(record.posted.at)}
        <span className="text-gray-900"> by {record.posted.by}</span>
      </Field>
      <Field label="Duration">
        <span className="tabular-nums">{duration(secondsOf(record))}</span>
        <span className="text-gray-900"> · {record.candidates.length} candidates</span>
      </Field>
      <Field label="Source">
        <span className="flex flex-col items-start gap-1.5">
          <ExternalLink
            href={repo ? `https://github.com/${repo}` : null}
            icon={repo ? <GitHub className="size-3.5" /> : null}
          >
            {repo ?? record.repository}
          </ExternalLink>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <ExternalLink
              href={issueUrl(record.repository, record.issue)}
              icon={<IssueIcon className="size-3.5" />}
            >
              Issue #{record.issue}
            </ExternalLink>
            {hire && (
              <ExternalLink
                href={commitUrl(record.repository, hire.merged)}
                icon={<Commit className="size-3.5" />}
              >
                <span className="font-mono text-[13px]">{sha7(hire.merged)}</span>
              </ExternalLink>
            )}
          </span>
        </span>
      </Field>
    </dl>
  );
}
