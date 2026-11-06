import { AGENTS, PEOPLE, ROOMS } from "@tryouts/kit";
import type { TryoutRecord } from "@tryouts/kit/record";
import Link from "next/link";
import { Code, Section } from "@/components/geist";
import { ArrowRight, GitHub } from "@/components/icons";
import { HowItWorks, type HowStep } from "@/components/landing/how-it-works";
import { ResultCard } from "@/components/landing/result-card";
import { type SwitchRow, WithoutSwitch } from "@/components/landing/without-switch";
import { Button } from "@/components/ui/button";
import { VideoButton } from "@/components/video-button";
import { day, hexOf } from "@/lib/format";
import { listRecords } from "@/lib/records";
import { appName, ownerOf } from "@/lib/run";
import { GITHUB_URL, repoName, SWITCH_URL } from "@/lib/site";

const HIRING = AGENTS.hiring.displayName.toLowerCase();

function cast(record: TryoutRecord | null) {
  return {
    lead: record ? ownerOf(record) : PEOPLE.lead.name,
    community: record?.admitted?.by ?? PEOPLE.community.name,
    leadApp: record ? appName(record, ROOMS.hiring) : "Slack",
    communityApp: record ? appName(record, record.admitted?.room ?? ROOMS.bugs) : "Discord",
  };
}

function howSteps(record: TryoutRecord | null): HowStep[] {
  const { lead, community, leadApp, communityApp } = cast(record);
  return [
    {
      title: "Post the job",
      text: `${lead}, the team lead, asks the ${HIRING} in #${ROOMS.hiring} on ${leadApp} for a bug fixer, and names the tools to try.`,
      switch: `creates one agent and one private room per tool, from a template the ${HIRING} runs.`,
    },
    {
      title: "Every tool fixes the same bug",
      text: "Claude Code, Codex and OpenCode each get the same real GitHub issue. Each one writes a fix and a test.",
      switch:
        "gives each agent a token budget and counts what it spends, the same way for every tool.",
    },
    {
      title: "Plain code checks every fix",
      text: "A referee runs the same 5 checks on each fix. The key one: the new test must fail without the fix. No AI does the judging.",
      switch:
        "records every message and token count, so the scoreboard uses the same numbers for everyone.",
    },
    {
      title: "The team lead hires the best one",
      text: `The ${HIRING} recommends the best verified fix. Nothing is hired or merged until ${lead} presses “Allow once”.`,
      switch: `turns the hire into an approval button. Only ${lead}, the agent's owner, can press it.`,
    },
    {
      title: "The hire starts work",
      text: `The ${HIRING} tries to add the hire to #${ROOMS.bugs} on ${communityApp}. ${community} owns that room, so she has to let it in. The other candidates are deleted once ${lead} confirms.`,
      switch:
        "refuses to let an agent into a room its owner doesn't own. It deletes nothing until the owner or an admin confirms.",
    },
  ];
}

function switchRows(record: TryoutRecord | null): SwitchRow[] {
  const { lead, community, leadApp, communityApp } = cast(record);
  return [
    {
      step: "Create the candidates",
      with: `The ${HIRING} runs one template. Switch creates an agent and a private room for each tool.`,
      without: "You set up three tools by hand, and nothing records who started what.",
    },
    {
      step: "Limit spending",
      with: "Switch counts each agent's tokens and stops it at its budget.",
      without: "A runaway agent keeps spending until someone notices.",
    },
    {
      step: "Compare costs",
      with: "Token counts come from Switch, counted the same way for every tool.",
      without: "Three vendor dashboards with three different counts.",
    },
    {
      step: "Approve the hire",
      with: `The hire is an approval button only ${lead}, the owner, can press.`,
      without: "Anyone in the channel, or the agent itself, can say it's hired.",
    },
    {
      step: "Join the community room",
      with: `Switch refuses the ${HIRING}'s invite to #${ROOMS.bugs}. ${community}, who runs it, has to let the hire in.`,
      without: "Any agent can walk into any room.",
    },
    {
      step: "Work across two apps",
      with: `#${ROOMS.hiring} is on ${leadApp} and #${ROOMS.bugs} is on ${communityApp}. One workflow covers both.`,
      without: "Copy and paste between apps.",
    },
    {
      step: "Delete the others",
      with: `The ${HIRING} can only ask. ${lead} has to confirm each deletion.`,
      without: "Agents delete agents, or nobody cleans up.",
    },
    {
      step: "Keep a record",
      with: "Every message, approval and token count on this site is read back from Switch.",
      without: "Screenshots.",
    },
  ];
}

const LIMITS = [
  "All candidates ran on one laptop, as one user.",
  "Token use is counted when an agent's turn ends.",
  "Codex doesn't report which model it used.",
  "Dollar amounts are estimates from list prices.",
  "One bug is a sample of one. Hold more tryouts before you decide.",
];

export default async function Home() {
  const records = await listRecords();
  const record = records.find((r) => r.hire) ?? records[0] ?? null;
  const repo = record ? (repoName(record.repository) ?? record.repository) : null;
  const verify = record?.hire ? `/verify/${hexOf(record.hire.digest)}` : "/verify";
  return (
    <>
      <section className="border-b border-gray-alpha-400 bg-background-100">
        <div className="container-page flex flex-col items-center py-16 text-center md:py-20">
          <a
            href={SWITCH_URL}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-label-14 text-gray-900 shadow-border transition-colors hover:text-gray-1000"
          >
            Built on Switch
            <ArrowRight className="size-3.5" />
          </a>
          <h1 className="mt-6 text-heading-40 text-balance md:text-heading-56">
            <span className="block">Don't pick your AI coding tool on vibes.</span>
            <span className="block">Hold tryouts.</span>
          </h1>
          <p className="mt-6 max-w-[640px] text-copy-18 text-gray-900 md:text-copy-20">
            Let a few AI coding tools fix the same real bug. Plain code checks each fix. Your team
            lead hires the best one with one button in Slack, and Switch makes sure nobody skips a
            step.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {record && (
              <Button asChild size="lg" shape="rounded">
                <Link href={`/tryouts/${record.issue}`}>View the run</Link>
              </Button>
            )}
            <Button asChild size="lg" shape="rounded" variant="secondary">
              <Link href={verify}>Check it yourself</Link>
            </Button>
            <Button asChild size="lg" shape="rounded" variant="secondary">
              <a href={GITHUB_URL}>
                <GitHub />
                GitHub
              </a>
            </Button>
            <VideoButton size="lg" shape="rounded" label="Watch the video" />
          </div>
        </div>
      </section>

      <div className="container-page flex flex-col gap-24 py-20">
        {record && (
          <Section
            id="result"
            title="The result of a real run"
            description={`Recorded on ${day(record.posted.at)}, on the ${repo} repository. Nothing on this page is typed in by hand.`}
          >
            <ResultCard record={record} />
          </Section>
        )}

        <Section
          id="how"
          title="How it works"
          description="Five steps. People make the decisions. Switch makes sure the agents follow them."
        >
          <HowItWorks steps={howSteps(record)}>
            <h3 className="text-heading-16">Check it yourself</h3>
            <p className="mt-1.5 text-copy-14 text-gray-900">
              Every referee report ends with a digest. Recompute it in your browser, or re-run every
              check on your own machine with <Code>make judge</Code>.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-auto self-start">
              <Link href={verify}>
                Check it yourself <ArrowRight />
              </Link>
            </Button>
          </HowItWorks>
        </Section>

        <Section
          id="without-switch"
          title="What breaks without Switch"
          description="Each step is a Switch feature, not a prompt. Take Switch away and this is what's left."
        >
          <WithoutSwitch rows={switchRows(record)} />
        </Section>

        <Section
          id="limits"
          title="What one tryout doesn't prove"
          description="Honest limits of the recorded run."
        >
          <ul className="card flex flex-col px-5 py-2">
            {LIMITS.map((line) => (
              <li
                key={line}
                className="flex gap-3 border-b border-gray-alpha-400 py-3 text-copy-14 text-gray-900 last:border-0"
              >
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-gray-500" />
                {line}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
