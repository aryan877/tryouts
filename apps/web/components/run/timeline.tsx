import type { TryoutRecord } from "@tryouts/kit/record";
import { AppName } from "@/components/app-glyph";
import { ExternalLink, Note } from "@/components/geist";
import { Blocked, Check, CheckCircle, Commit, IssueIcon, SwitchIcon } from "@/components/icons";
import { clock, sha7 } from "@/lib/format";
import { appOf, type Step, stepsOf } from "@/lib/run";
import { commitUrl, issueUrl } from "@/lib/site";

function Approval({ record }: { record: TryoutRecord }) {
  const approval = record.hire?.approval;
  if (!approval?.answer) return null;
  return (
    <Note className="mt-3">
      <code className="w-full text-copy-13-mono break-all text-gray-1000">
        <span className="text-gray-900 select-none">$ </span>
        {approval.command}
      </code>
      <span className="inline-flex flex-wrap items-center gap-x-1.5 text-label-14 text-gray-1000">
        <Check className="text-green-700" />
        <strong className="font-medium">{approval.answer}</strong>
        <span className="text-gray-900">·</span>
        {approval.answeredBy}
        <span className="text-gray-900">·</span>
        <AppName app={appOf(record, approval.room)} />
      </span>
    </Note>
  );
}

function Links({ record, step }: { record: TryoutRecord; step: Step }) {
  if (!step.sha && !step.issue) return null;
  const commit = step.sha ? commitUrl(record.repository, step.sha) : null;
  const issue = step.issue ? issueUrl(record.repository, step.issue) : null;
  if (!commit && !issue) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-label-14 text-gray-1000">
      {step.sha && commit && (
        <ExternalLink href={commit} icon={<Commit className="size-3.5 text-gray-900" />}>
          Commit <span className="font-mono text-[13px]">{sha7(step.sha)}</span>
        </ExternalLink>
      )}
      {step.issue && issue && (
        <ExternalLink href={issue} icon={<IssueIcon className="size-3.5 text-gray-900" />}>
          Issue #{step.issue}
        </ExternalLink>
      )}
    </p>
  );
}

export function Timeline({ record }: { record: TryoutRecord }) {
  const steps = stepsOf(record);
  return (
    <ol className="card">
      {steps.map((step) => (
        <li
          key={step.key}
          className="flex gap-3 border-b border-gray-alpha-400 px-4 py-4 last:border-0 sm:px-5"
        >
          {step.kind === "refused" ? (
            <Blocked className="mt-0.5 size-5 text-amber-900" />
          ) : (
            <CheckCircle className="mt-0.5 size-5 text-green-700" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3 className="text-heading-14 font-medium">{step.title}</h3>
              <time dateTime={step.at} className="text-label-13-mono text-gray-900">
                {clock(step.at)}
              </time>
            </div>
            <p className="mt-1 text-copy-14 text-gray-900">{step.text}</p>
            {step.quote && (
              <blockquote className="mt-2 border-l-2 border-gray-alpha-400 pl-3 text-copy-14 text-gray-900">
                “{step.quote}”
              </blockquote>
            )}
            {step.kind === "approved" && <Approval record={record} />}
            <Links record={record} step={step} />
            {step.switch && (
              <p className="mt-2.5 flex items-start gap-2 text-label-14 text-gray-900">
                <SwitchIcon className="mt-0.5 text-blue-700" />
                <span>
                  <strong className="font-medium text-gray-1000">Switch:</strong> {step.switch}
                </span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
