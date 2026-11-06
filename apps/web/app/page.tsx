import { AGENTS, ALIAS, MACHINE, PEOPLE, ROOMS } from "@tryouts/kit";
import type { TryoutRecord } from "@tryouts/kit/record";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { ArrowRight } from "@/components/icons";
import { ImportTemplate } from "@/components/import-template";
import { HeroScreen } from "@/components/landing/hero-screen";
import { HowItWorks } from "@/components/landing/how-it-works";
import { RemoveSwitchTable, type SwitchRow } from "@/components/landing/remove-switch";
import { LogoMark } from "@/components/logo";
import { AgentCard } from "@/components/tryouts/agent-card";
import { APP_LABEL } from "@/components/tryouts/app-glyph";
import { Handover } from "@/components/tryouts/handover";
import { Button } from "@/components/ui/button";
import { VideoButton } from "@/components/video-button";
import { appOf, endOf, ownerOf } from "@/lib/board";
import { digestShort, sha7 } from "@/lib/format";
import { listRecords } from "@/lib/records";
import { commitUrl, SWITCH_URL, VIDEO_URL } from "@/lib/site";

const Code = ({ children }: { children: string }) => (
  <code className="mono rounded-[3px] bg-sunken px-1 py-px text-[0.88em]">{children}</code>
);

function switchRows(record: TryoutRecord | null): SwitchRow[] {
  const board = record ? `/tryouts/${record.issue}` : undefined;
  const hire = record?.hire ? `/hires/${record.hire.agent}` : undefined;
  const owner = record ? ownerOf(record) : PEOPLE.lead.name;
  const community = record?.admitted?.by ?? PEOPLE.community.name;
  const n = record?.candidates.length ?? 3;
  return [
    {
      step: "An agent creates agents",
      with: (
        <>
          {AGENTS.hiring.name} runs one template with <Code>run_template</Code>. Switch creates {n}{" "}
          managed agents on {MACHINE}, and template v2's <Code>if:</Code> picks which vendors try
          out.
        </>
      ),
      without: "You start three tools by hand. Nothing records who started what.",
      proof: board,
    },
    {
      step: "Three vendors, one controller",
      with: `Claude Code, Codex and OpenCode run under one Switch agent controller on ${owner}'s laptop.`,
      without: "Three setups, three logs, three ways to stop them.",
      proof: board,
    },
    {
      step: "A room per candidate",
      with: `The same template opens a private room for each candidate, grouped as one room group.`,
      without: "One shared terminal, or copy and paste between windows.",
      proof: board,
    },
    {
      step: "Token budgets",
      with: "Switch counts each agent's tokens and stops it at its budget.",
      without: "A runaway candidate spends until someone notices.",
      proof: board,
    },
    {
      step: "Cost per verified fix",
      with: "From Switch's usage records, counted the same way for every vendor.",
      without: "Three vendor dashboards, three different counts.",
      proof: board,
    },
    {
      step: "Only the owner hires",
      with: `The hire is an approval card. Only ${owner}, the agent's owner, can answer it.`,
      without: "Anyone in the channel, or the agent itself, can say “hired”.",
      proof: hire,
    },
    {
      step: "A second key for #bugs",
      with: (
        <>
          Switch refuses {AGENTS.hiring.name}'s invite to #{ROOMS.bugs}. A person in #{ROOMS.bugs},{" "}
          {community}, has to let the hire in, and names it <Code>{`@${ALIAS}`}</Code>.
        </>
      ),
      without: "Any agent can walk into any room.",
      proof: hire,
    },
    {
      step: "Two chat apps",
      with: `#${ROOMS.hiring} is on Slack, #${ROOMS.bugs} is on Discord. One workflow runs across both.`,
      without: "Copy and paste between apps.",
      proof: board,
    },
    {
      step: "Dismissal needs a person",
      with: (
        <>
          {AGENTS.hiring.name} can only ask. Deletion waits for the owner, {owner}, or an admin to
          type <Code>{"!delete-agent <name> confirm"}</Code> within two minutes.
        </>
      ),
      without: "Agents delete agents, or nobody cleans up.",
      proof: board,
    },
    {
      step: "One record",
      with: "The board shows messages, approvals and usage read from Switch, nothing typed in by hand.",
      without: "Screenshots.",
      proof: record ? `/records/${record.issue}.json` : undefined,
    },
  ];
}

function Hero({ record }: { record: TryoutRecord | null }) {
  const ctas = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
      {VIDEO_URL ? <VideoButton size="lg" label="Watch the 2:30 video" /> : null}
      <Button asChild size="lg" variant={VIDEO_URL ? "outline" : "default"}>
        <Link href={record ? `/tryouts/${record.issue}` : "/tryouts"}>
          Open the live board <ArrowRight className="size-4" />
        </Link>
      </Button>
      <ImportTemplate />
    </div>
  );
  return (
    <section className="container-page grid gap-8 pt-10 pb-12 lg:grid-cols-12 lg:gap-6 lg:pt-16 lg:pb-16">
      <div className="flex flex-col lg:col-span-5 lg:pr-6">
        <h1>
          <span className="block text-[clamp(32px,3.6vw,50px)] leading-[1.04] font-[600] tracking-[-0.02em] text-ink-2">
            Don't pick your AI agent on vibes.
          </span>
          <span className="mt-2 block text-[clamp(56px,6.4vw,92px)] leading-[0.92] font-[800] tracking-[-0.015em] uppercase wdth-75">
            Hold tryouts.
          </span>
        </h1>
        <p className="mt-6 max-w-[30em] text-[18px] leading-7 text-ink-2">
          A hiring agent creates three coding agents in your Slack. They fix the same real bug.
          Plain code checks their work, and you hire the winner with one tap.
        </p>
        <div className="mt-8 hidden lg:block">{ctas}</div>
      </div>
      <div className="lg:col-span-7">
        {record ? (
          <HeroScreen record={record} />
        ) : (
          <div className="screen grid aspect-[16/11] place-items-center rounded-panel p-8 text-center">
            <div>
              <LogoMark size={28} />
              <p className="h3 mt-4 text-screen-ink">No tryouts recorded yet.</p>
              <p className="mt-2 text-[14px] text-screen-ink-2">
                The first recorded run will show here, start to hire.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="lg:hidden">{ctas}</div>
    </section>
  );
}

function ProofStrip({ record }: { record: TryoutRecord }) {
  const hire = record.hire;
  if (!hire) return null;
  const merged = commitUrl(record.repository, hire.merged);
  const app = appOf(record, hire.approval.room);
  const link =
    "underline decoration-line-strong underline-offset-[3px] hover:text-ink hover:decoration-ink";
  return (
    <div className="border-y border-line bg-surface">
      <p className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-3.5 text-[13px] text-ink-2">
        {merged ? (
          <a href={merged} className={link}>
            Merged <span className="mono">{sha7(hire.merged)}</span> → main
          </a>
        ) : (
          <span>
            Merged <span className="mono">{sha7(hire.merged)}</span> → main
          </span>
        )}
        <span aria-hidden className="text-ink-4">
          ·
        </span>
        <Link href={`/verify/${hire.digest.replace("sha256:", "")}`} className={link}>
          Hire record <span className="mono">{digestShort(hire.digest)}</span>
        </Link>
        <span aria-hidden className="text-ink-4">
          ·
        </span>
        <Link href={`/hires/${hire.agent}`} className={link}>
          Approved in {app ? APP_LABEL[app] : "Switch"}
        </Link>
        <span aria-hidden className="text-ink-4">
          ·
        </span>
        <a href={SWITCH_URL} className={link}>
          Built on Switch
        </a>
      </p>
    </div>
  );
}

function HireSection({ record }: { record: TryoutRecord }) {
  const hire = record.hire;
  const hired = record.candidates.find((c) => c.agent === hire?.agent);
  if (!hire || !hired) return null;
  return (
    <section aria-labelledby="record-title" className="border-y border-line bg-surface">
      <div className="container-page grid gap-12 py-18 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16 lg:py-24">
        <div className="order-2 flex flex-col items-start gap-5 lg:order-1">
          <AgentCard record={record} candidate={hired} />
          <Button asChild variant="outline">
            <Link href={`/hires/${hire.agent}`}>
              Open the hire record <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <h2 id="record-title" className="h2">
            Every tryout ends in a hire record.
            <span className="block text-ink-3">Then the hire is on probation.</span>
          </h2>
          <p className="mt-4 max-w-[40em] text-[16px] leading-[25px] text-ink-2">
            The record names who was hired, who approved it, what it cost, and the exact commit that
            merged. Then the hire works for a community it doesn't own, in an app its boss doesn't
            use.
          </p>
          <Handover record={record} at={endOf(record)} className="mt-8 shadow-raised" />
        </div>
      </div>
    </section>
  );
}

function VerifyTeaser({ record }: { record: TryoutRecord }) {
  const hire = record.hire;
  if (!hire) return null;
  return (
    <section aria-labelledby="verify-title" className="container-page pb-18 lg:pb-24">
      <div className="screen grid grid-cols-[minmax(0,1fr)] gap-8 rounded-panel p-6 md:p-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <h2 id="verify-title" className="h2 text-screen-ink">
            Check it yourself. No login.
          </h2>
          <p className="mt-3 max-w-[34em] text-[16px] leading-[25px] text-screen-ink-2">
            The referee is plain code. Its card ends with a digest. Recompute it in your browser
            from the evidence, or re-run every check on your own machine.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:col-span-6">
          <div className="flex items-center gap-3 rounded-control bg-screen-row px-4 py-3">
            <span className="mono min-w-0 flex-1 truncate text-[13px] text-screen-ink">
              {hire.digest}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/verify/${hire.digest.replace("sha256:", "")}`}
              className="inline-flex h-11 items-center gap-2 rounded-control bg-screen-ink px-4 text-[14px] font-semibold text-screen shadow-[inset_0_-2px_0_rgb(0_0_0/0.2)]"
            >
              Recompute in your browser <ArrowRight className="size-4" />
            </Link>
            <span className="flex items-center gap-1 rounded-control bg-screen-row pl-3">
              <code className="mono text-[13px] text-screen-ink-2">$ make judge</code>
              <CopyButton
                value="make judge"
                label="Copy make judge"
                className="text-screen-ink-2 hover:bg-screen-line hover:text-screen-ink"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const LIMITS = [
  "All candidates ran on one machine, as one OS user.",
  "Usage is counted when a turn ends, in UTC hours.",
  "Codex doesn't report its model.",
  "Dollar amounts are list-price estimates.",
  "One bug is a sample of one.",
];

export default async function Home() {
  const records = await listRecords();
  const record = records.find((r) => r.hire) ?? records[0] ?? null;
  return (
    <>
      <Hero record={record} />
      {record && <ProofStrip record={record} />}
      <HowItWorks record={record} />
      {record && <HireSection record={record} />}
      <section
        id="without-switch"
        aria-labelledby="without-title"
        className="container-page scroll-mt-20 py-18 lg:py-24"
      >
        <h2 id="without-title" className="h2">
          Take Switch away and the tryout stops.
        </h2>
        <p className="mt-3 max-w-[40em] text-[16px] leading-[25px] text-ink-2">
          Each step below is a Switch feature, not a prompt. Turn it off and see what is left.
        </p>
        <div className="mt-8">
          <RemoveSwitchTable rows={switchRows(record)} />
        </div>
      </section>
      {record && <VerifyTeaser record={record} />}
      <section aria-labelledby="limits-title" className="container-page pb-24">
        <h2 id="limits-title" className="h3">
          What one tryout does not prove.
        </h2>
        <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-[14px] leading-[21px] text-ink-2 md:grid-cols-2">
          {LIMITS.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="text-ink-4">
                —
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
