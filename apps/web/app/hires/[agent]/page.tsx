import { AGENTS, ALIAS, MACHINE } from "@tryouts/kit";
import type { FeedItem, TryoutRecord } from "@tryouts/kit/record";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/icons";
import { ShareMenu } from "@/components/share-menu";
import { AgentCard } from "@/components/tryouts/agent-card";
import { APP_LABEL, AppGlyph } from "@/components/tryouts/app-glyph";
import { bibColor } from "@/components/tryouts/bib";
import { HireCard } from "@/components/tryouts/hire-card";
import { ProbationTracker } from "@/components/tryouts/probation-tracker";
import { Tip } from "@/components/tryouts/tip";
import { Button } from "@/components/ui/button";
import { appOf, ownerOf, roomOf, vendorOf } from "@/lib/board";
import { flipScript } from "@/lib/flip";
import { clock, day, digestShort, dollars, elapsed, ms, sha7, tokens } from "@/lib/format";
import { getHire, listRecords } from "@/lib/records";
import { commitUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  return (await listRecords()).flatMap((record) =>
    record.hire ? [{ agent: record.hire.agent }] : [],
  );
}

export async function generateMetadata({ params }: PageProps<"/hires/[agent]">): Promise<Metadata> {
  const { agent } = await params;
  const record = await getHire(agent);
  if (!record?.hire) return { title: "Hire record" };
  const c = record.candidates.find((x) => x.agent === agent);
  return {
    title: `${agent} hired as ${record.role}`,
    description: `${c ? `${dollars(c.cost)} per verified fix, est. ` : ""}Approved by ${ownerOf(record)}. Built on Switch.`,
  };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-4 border-b border-line py-3 last:border-b-0 sm:grid-cols-[136px_minmax(0,1fr)]">
      <dt className="caps pt-0.5 text-ink-3">{label}</dt>
      <dd className="min-w-0 text-[14px] leading-[21px] text-ink">{children}</dd>
    </div>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => (
  <span className="block text-[13px] text-ink-3">{children}</span>
);

const CELL = {
  switch: "bg-ink",
  referee: "zebra shadow-[inset_0_0_0_1px_var(--ink)]",
  person: "shadow-[inset_0_0_0_1.5px_var(--ink-3)]",
  hiring: "bg-ink-3",
} as const;

function cellOf(item: FeedItem, record: TryoutRecord): { className: string; color?: string } {
  const bib = record.candidates.find((c) => c.agent === item.actor)?.bib;
  if (bib) return { className: "", color: bibColor(bib) };
  if (item.kind === "switch" || item.kind === "referee" || item.kind === "person") {
    return { className: CELL[item.kind] };
  }
  return { className: CELL.hiring };
}

export default async function HirePage({ params }: PageProps<"/hires/[agent]">) {
  const { agent } = await params;
  const record = await getHire(agent);
  const hire = record?.hire;
  const c = record?.candidates.find((x) => x.agent === agent);
  if (!record || !hire || !c) {
    return (
      <EmptyState
        title={`No hire record for ${agent}.`}
        body="A hire record exists only after an owner approves a hire in Switch."
        action={{ href: "/hires", label: "See every hire" }}
      />
    );
  }
  const approvedIn = appOf(record, hire.approval.room);
  const merged = commitUrl(record.repository, hire.merged);
  const bugs = record.admitted ? roomOf(record, record.admitted.room) : undefined;
  const field = record.candidates.filter((x) => x.agent !== agent);
  const hex = hire.digest.replace("sha256:", "");
  const strip = record.feed.filter((item) => ms(item.at) <= ms(hire.at) + 60_000);

  return (
    <div className="container-page pt-6 pb-24">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a static pre-paint flag, built from the agent name only */}
      <script dangerouslySetInnerHTML={{ __html: flipScript(agent) }} />
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/tryouts/${record.issue}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-control px-2 text-[14px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Tryout #{record.issue}
        </Link>
        <span className="ml-auto flex gap-2">
          <ShareMenu
            path={`/hires/${agent}`}
            card={`/hires/${agent}/card.png`}
            digest={hire.digest}
          />
          <Button asChild>
            <Link href={`/verify/${hex}`}>
              Verify it <ArrowRight className="size-4" />
            </Link>
          </Button>
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-14">
        <div className="mx-auto lg:mx-0">
          <HireCard record={record} candidate={c} />
        </div>
        <div className="min-w-0">
          <p className="caps text-ink-3">Hire record</p>
          <h1 className="h1 mt-2">
            {agent} hired as {record.role}
          </h1>
          <p className="mt-2 text-[16px] text-ink-2">
            For #{record.issue} · {record.title}
          </p>
          <dl className="panel mt-6 px-4">
            <Fact label="Approved by">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                {hire.approval.answeredBy ?? ownerOf(record)} ·
                <AppGlyph app={approvedIn} className="size-3.5" />
                {approvedIn ? APP_LABEL[approvedIn] : "Switch"} #{hire.approval.room}
              </span>
              <Sub>
                “{hire.approval.answer}” at {clock(hire.approval.answeredAt ?? hire.at)} UTC on{" "}
                {day(hire.approval.answeredAt ?? hire.at)} · an approval card only the owner can
                answer
              </Sub>
            </Fact>
            <Fact label="Created by">
              <span className="mono">{AGENTS.hiring.name}</span> with run_template, on{" "}
              {c.machine || MACHINE}
              <Sub>
                {clock(c.createdAt)} UTC · bib {c.bib} · {vendorOf(c)} ·{" "}
                {c.model ? <span className="mono">{c.model}</span> : "model not reported"}
              </Sub>
            </Fact>
            <Fact label="Merged">
              <span className="mono">{sha7(hire.sha)}</span> →{" "}
              {merged ? (
                <a
                  href={merged}
                  className="mono inline-flex items-center underline decoration-line-strong underline-offset-2 hover:decoration-ink"
                >
                  {sha7(hire.merged)} <ArrowUpRight className="size-3" />
                </a>
              ) : (
                <span className="mono">{sha7(hire.merged)}</span>
              )}{" "}
              on main
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {hire.trailers.map((trailer) => (
                  <li key={trailer} className="mono text-[12px] text-ink-3">
                    {trailer}
                  </li>
                ))}
              </ul>
            </Fact>
            <Fact label="Digest">
              <span className="flex items-center gap-1">
                <Link
                  href={`/verify/${hex}`}
                  className="mono underline decoration-line-strong underline-offset-2 hover:decoration-ink"
                >
                  {digestShort(hire.digest)}
                </Link>
                <CopyButton value={hire.digest} label="Copy the digest" />
              </span>
            </Fact>
            <Fact label="Numbers">
              <Tip
                label={`Tokens from Switch × list price on ${day(record.prices.asOf)}. Subscriptions may cost less.`}
              >
                <span className="font-semibold">{dollars(c.cost)} per verified fix</span> · est.
              </Tip>
              <Sub>
                {c.seconds !== null ? `${elapsed(c.seconds)} from creation to last commit · ` : ""}
                {c.budget
                  ? `${tokens(c.budget.spent)} of its ${tokens(c.budget.limit)} output-token budget in Switch`
                  : "no budget set"}
              </Sub>
            </Fact>
            <Fact label="Rooms">
              <span className="inline-flex flex-wrap items-center gap-x-1.5">
                <span className="mono">#{c.room}</span>
                <AppGlyph app={appOf(record, c.room)} className="size-3.5" />
                {bugs && (
                  <>
                    <span className="text-ink-3">then</span>
                    <span className="mono">#{bugs.name}</span>
                    <AppGlyph app={bugs.app} className="size-3.5" />
                  </>
                )}
              </span>
            </Fact>
            {record.admitted && (
              <Fact label="Role">
                <span className="mono">@{ALIAS}</span> in #{record.admitted.room},{" "}
                {bugs?.owner ?? record.admitted.by}'s room
                <Sub>
                  Switch refused {AGENTS.hiring.name}'s invite. {record.admitted.by} let it in at{" "}
                  {clock(record.admitted.at)} UTC.
                </Sub>
              </Fact>
            )}
          </dl>
          <div className="mt-6">
            <ProbationTracker record={record} />
          </div>
        </div>
      </div>

      <section aria-labelledby="field-title" className="mt-20">
        <h2 id="field-title" className="h2">
          The field
        </h2>
        <p className="mt-2 text-[15px] text-ink-2">
          Dismissed for this job. Every stat stays on the record.
        </p>
        <ul className="mt-6 flex flex-wrap gap-6">
          {field.map((x) => {
            const deletion = record.deletions.find((d) => d.agent === x.agent);
            return (
              <li key={x.agent} className="flex flex-col gap-2">
                <AgentCard record={record} candidate={x} size="md" />
                <span className="text-[13px] text-ink-3">
                  Dismissed for this job
                  {deletion
                    ? ` · deleted ${clock(deletion.at)}, confirmed by ${deletion.confirmedBy}`
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="decided-title" className="mt-20">
        <h2 id="decided-title" className="h2">
          How it was decided
        </h2>
        <p className="mt-2 max-w-[48em] text-[15px] leading-[23px] text-ink-2">{record.rule}</p>
        <ol aria-label="Every event up to the hire" className="mt-5 flex flex-wrap gap-[3px]">
          {strip.map((item) => {
            const cell = cellOf(item, record);
            return (
              <li key={`${item.at}-${item.actor}`}>
                <Tip label={`${clock(item.at)} · ${item.actor}: ${item.text}`}>
                  <span
                    className={cn("block size-2.5 rounded-[2px]", cell.className)}
                    style={cell.color ? { backgroundColor: cell.color } : {}}
                  />
                </Tip>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-3">
          <span>One square per message, oldest first.</span>
          {[
            { label: "Switch", className: CELL.switch },
            { label: "Referee", className: CELL.referee },
            { label: "Hiring manager", className: CELL.hiring },
            { label: "People", className: CELL.person },
          ].map((legend) => (
            <span key={legend.label} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-[2px]", legend.className)} />
              {legend.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="flex gap-px">
              {record.candidates.map((x) => (
                <span
                  key={x.agent}
                  className="size-2.5 rounded-[2px]"
                  style={{ backgroundColor: bibColor(x.bib) }}
                />
              ))}
            </span>
            Candidates, by bib
          </span>
        </p>
      </section>
    </div>
  );
}
