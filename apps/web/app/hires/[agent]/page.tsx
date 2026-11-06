import type { Metadata } from "next";
import Link from "next/link";
import { AppName } from "@/components/app-glyph";
import { EmptyState } from "@/components/empty-state";
import { Badge, ExternalLink } from "@/components/geist";
import { Commit, IssueIcon } from "@/components/icons";
import { CheckDots } from "@/components/run/check-dots";
import { Button } from "@/components/ui/button";
import { day, dollars, duration, hexOf, sha7, tokens, when } from "@/lib/format";
import { getHire, listRecords } from "@/lib/records";
import { appName, appOf, ownerOf, standings, vendorOf } from "@/lib/run";
import { commitUrl, issueUrl, repoName } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  return (await listRecords()).flatMap((record) =>
    record.hire ? [{ agent: record.hire.agent }] : [],
  );
}

export async function generateMetadata({ params }: PageProps<"/hires/[agent]">): Promise<Metadata> {
  const { agent } = await params;
  const record = await getHire(agent);
  if (!record?.hire) return { title: "Hire" };
  return {
    title: `${agent} hired as ${record.role}`,
    description: `Picked from ${record.candidates.length} candidates on tryout #${record.issue}. Approved by ${ownerOf(record)}. Built on Switch.`,
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-gray-alpha-400 px-6 py-4 last:border-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-label-14 text-gray-900">{label}</dt>
      <dd className="min-w-0 text-copy-14 text-gray-1000">{children}</dd>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 bg-background-100 px-6 py-5">
      <span className="text-label-14 text-gray-900">{label}</span>
      <span className="text-heading-24 tabular-nums">{value}</span>
      {sub && <span className="text-label-13 text-gray-900">{sub}</span>}
    </div>
  );
}

export default async function HirePage({ params }: PageProps<"/hires/[agent]">) {
  const { agent } = await params;
  const record = await getHire(agent);
  const hire = record?.hire;
  const standing = record ? standings(record).find((s) => s.candidate.agent === agent) : null;
  if (!record || !hire || !standing) {
    return (
      <EmptyState
        title={`No hire record for ${agent}.`}
        body="A hire record exists only after the team lead approves a hire in Switch."
        action={{ href: "/hires", label: "See every hire" }}
      />
    );
  }
  const c = standing.candidate;
  const repo = repoName(record.repository) ?? record.repository;
  const bugs = record.admitted?.room;
  const { of, fixes } = record.probation;
  const done = Math.min(fixes.length, of);
  const approvedAt = hire.approval.answeredAt ?? hire.at;

  return (
    <div className="container-page max-w-[960px] py-10">
      <nav aria-label="Breadcrumb" className="text-label-14 text-gray-900">
        <Link href="/tryouts" className="hover:text-gray-1000">
          Tryouts
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link href={`/tryouts/${record.issue}`} className="hover:text-gray-1000">
          #{record.issue}
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-1000">{agent}</span>
      </nav>

      <article className="card mt-4 overflow-hidden">
        <header className="flex flex-wrap items-center gap-4 px-6 py-6">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full border border-gray-alpha-400 bg-gray-100 text-label-16 font-medium uppercase"
          >
            {agent.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-heading-24">{agent}</h1>
              <Badge tone="blue">Hired as @{record.role}</Badge>
            </div>
            <p className="mt-0.5 text-copy-14 text-gray-900">
              {vendorOf(c)} · {c.model ?? "model not reported"}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/verify/${hexOf(hire.digest)}`}>Check it yourself</Link>
          </Button>
        </header>

        <dl className="border-t border-gray-alpha-400">
          <Row label="Hired for">
            Fixing bugs in {repo}.
            {bugs &&
              ` It works in #${bugs} on ${appName(record, bugs)} as @${record.role}, after ${record.admitted?.by} let it in.`}
          </Row>
          <Row label="Approved by">
            <span className="inline-flex flex-wrap items-center gap-x-1.5">
              {hire.approval.answeredBy ?? ownerOf(record)} pressed “{hire.approval.answer}” in
              <AppName app={appOf(record, hire.approval.room)} />
              <span className="text-gray-900">· {when(approvedAt)}</span>
            </span>
          </Row>
          <Row label="Picked from">
            <Link href={`/tryouts/${record.issue}`} className="font-medium hover:underline">
              Tryout #{record.issue}
            </Link>{" "}
            <span className="text-gray-900">
              · ranked {standing.rank} of {record.candidates.length} · {record.title}
            </span>
          </Row>
          <Row label="Referee checks">
            <span className="flex items-center gap-2">
              <CheckDots checks={standing.checks} />
              <span className="text-gray-900">{standing.passed} of 5 passed</span>
            </span>
          </Row>
        </dl>

        <div className="grid gap-px border-t border-gray-alpha-400 bg-gray-alpha-400 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Time to fix" value={c.seconds !== null ? duration(c.seconds) : "—"} />
          <Stat
            label="Est. cost"
            value={dollars(c.cost)}
            sub={`List prices on ${day(record.prices.asOf)}`}
          />
          <Stat
            label="Tokens in / out"
            value={`${tokens(c.tokens.input + c.tokens.cacheRead + c.tokens.cacheWrite)} / ${tokens(c.tokens.output)}`}
            sub="Counted by Switch"
          />
          <Stat
            label="Lines changed"
            value={c.diff ? `+${c.diff.added} −${c.diff.removed}` : "—"}
          />
        </div>

        <section aria-labelledby="merge-title" className="border-t border-gray-alpha-400 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="merge-title" className="text-heading-16">
              Merge commit
            </h2>
            <span className="flex flex-wrap gap-x-5 gap-y-1 text-label-14">
              <ExternalLink
                href={commitUrl(record.repository, hire.merged)}
                icon={<Commit className="size-3.5 text-gray-900" />}
              >
                <span className="font-mono text-[13px]">{sha7(hire.merged)}</span>
              </ExternalLink>
              <ExternalLink
                href={issueUrl(record.repository, hire.issue)}
                icon={<IssueIcon className="size-3.5 text-gray-900" />}
              >
                Issue #{hire.issue}
              </ExternalLink>
            </span>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md border border-gray-alpha-400 bg-background-200 px-4 py-3 text-copy-13-mono text-gray-1000">
            {hire.trailers.join("\n")}
          </pre>
        </section>

        <section
          aria-labelledby="probation-title"
          className="border-t border-gray-alpha-400 px-6 py-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="probation-title" className="text-heading-16">
              Probation
            </h2>
            <span className="text-label-14 text-gray-900">
              {done >= of ? `Passed: ${of} of ${of} jobs` : `${done} of ${of} jobs done`}
            </span>
          </div>
          <div className="mt-3 flex gap-1" aria-hidden>
            {Array.from({ length: of }, (_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: probation slots are positional
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full",
                  i < done ? "bg-green-700" : "bg-gray-alpha-200",
                )}
              />
            ))}
          </div>
          {fixes.length > 0 ? (
            <ol className="mt-4 flex flex-col gap-2">
              {fixes.map((fix) => (
                <li
                  key={fix.issue}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 text-copy-14 text-gray-900"
                >
                  <span>
                    <strong className="font-medium text-gray-1000">Issue #{fix.issue}</strong> ·{" "}
                    {fix.title} · reported by {fix.reportedBy}
                  </span>
                  <span className="flex gap-x-4 text-label-14 text-gray-1000">
                    <ExternalLink
                      href={commitUrl(record.repository, fix.merged)}
                      icon={<Commit className="size-3.5 text-gray-900" />}
                    >
                      <span className="font-mono text-[13px]">{sha7(fix.merged)}</span>
                    </ExternalLink>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-copy-14 text-gray-900">No real jobs yet.</p>
          )}
        </section>
      </article>
    </div>
  );
}
