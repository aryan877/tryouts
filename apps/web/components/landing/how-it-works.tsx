import { Scale } from "@/components/icons";
import { DiscordLogo, GitHubLogo, type Logo, SlackLogo, SwitchLogo } from "@/components/logos";
import { Band, SectionTitle } from "@/components/section";
import { Tick } from "./illustrations";

const PLACES = {
  slack: { label: "Slack", Mark: SlackLogo },
  switch: { label: "Switch", Mark: SwitchLogo },
  referee: { label: "Referee", Mark: Scale },
  github: { label: "GitHub", Mark: GitHubLogo },
  discord: { label: "Discord", Mark: DiscordLogo },
} satisfies Record<string, { label: string; Mark: Logo }>;

type Place = keyof typeof PLACES;

const CHECKS = [
  "Built on the latest code",
  "Adds a test for the bug",
  "Changes only what the bug needs",
  "All tests pass with the fix",
  "The new test fails without the fix",
];

function Checks() {
  return (
    <ul className="mt-5 overflow-hidden rounded-xl border border-gray-alpha-300 bg-background-100">
      {CHECKS.map((check, i) => (
        <li
          key={check}
          className="flex items-center gap-3 border-b border-gray-alpha-200 px-4 py-2.5 text-copy-15 text-gray-1000 last:border-0"
        >
          <Tick className="size-5" />
          {check}
          {i === CHECKS.length - 1 && (
            <span className="ml-auto rounded-full bg-badge-blue px-2 py-0.5 text-label-13 whitespace-nowrap text-blue-900">
              The key one
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Probation() {
  return (
    <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-gray-alpha-300 bg-background-100 px-3.5 py-2">
      <span className="flex gap-1" aria-hidden>
        <span className="h-1.5 w-7 rounded-full bg-green-700" />
        <span className="h-1.5 w-7 rounded-full bg-gray-alpha-400" />
        <span className="h-1.5 w-7 rounded-full bg-gray-alpha-400" />
      </span>
      <span className="text-label-14 text-gray-1000">Probation: 1 of 3</span>
    </div>
  );
}

const STEPS: { places: Place[]; title: string; body: React.ReactNode }[] = [
  {
    places: ["slack"],
    title: "Post the job",
    body: (
      <>
        <p>The team lead posts a job in #hiring:</p>
        <blockquote className="mt-4 border-l-2 border-gray-alpha-500 pl-4 font-serif text-[22px] leading-8 text-gray-1000">
          “We need a bug fixer. Hold a tryout on #1 with Claude Code, Codex and OpenCode.”
        </blockquote>
      </>
    ),
  },
  {
    places: ["switch"],
    title: "The hiring manager sets it up",
    body: (
      <p>
        A hiring-manager agent creates the three candidate agents itself, each with its own private
        room.
      </p>
    ),
  },
  {
    places: ["switch"],
    title: "Same bug, same budget",
    body: <p>Each candidate gets a token budget. Each one writes a test and a fix.</p>,
  },
  {
    places: ["referee"],
    title: "Plain code checks every fix",
    body: (
      <>
        <p>The referee runs the same 5 checks on every fix. No AI decides who passes.</p>
        <Checks />
        <p className="mt-5">
          Then a scoreboard ranks them: verified first, then cheapest, then fastest.
        </p>
      </>
    ),
  },
  {
    places: ["slack", "github"],
    title: "Hire with one button",
    body: (
      <p>
        The hire is an “Allow once” button only the team lead can press. It merges the exact checked
        code on GitHub and closes the issue.
      </p>
    ),
  },
  {
    places: ["discord"],
    title: "The hire starts on probation",
    body: (
      <>
        <p>
          The hire tries to join the community's #bugs room. Switch says no, because it isn't the
          team lead's room. The community lead lets it in as @bugfixer. Its first real fix is
          checked and approved the same way.
        </p>
        <Probation />
      </>
    ),
  },
];

function PlaceTag({ place }: { place: Place }) {
  const { label, Mark } = PLACES[place];
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-gray-alpha-300 bg-background-100 px-2.5 text-label-13 font-medium text-gray-1000">
      <Mark className="size-3.5" />
      {label}
    </span>
  );
}

export function HowItWorks() {
  return (
    <Band id="how" labelledBy="how-title">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionTitle
            id="how-title"
            eyebrow="How it works"
            title="From a job post to a hire, all in chat."
          >
            People make the two calls that matter: who gets hired, and who gets into the community.
            Switch makes the agents wait for them.
          </SectionTitle>
        </div>
        <ol className="flex flex-col">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="reveal group grid grid-cols-[36px_minmax(0,1fr)] gap-x-6"
            >
              <div className="flex flex-col items-center">
                <span className="grid size-9 place-items-center rounded-full border border-gray-alpha-400 bg-background-100 font-mono text-label-14 text-gray-1000">
                  {i + 1}
                </span>
                <span
                  aria-hidden
                  className="my-2 w-px flex-1 bg-gradient-to-b from-gray-alpha-400 to-transparent group-last:hidden"
                />
              </div>
              <div className="pb-14 group-last:pb-0">
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {step.places.map((place) => (
                    <PlaceTag key={place} place={place} />
                  ))}
                </div>
                <h3 className="mt-4 text-heading-24">{step.title}</h3>
                <div className="mt-2 text-copy-16 text-gray-900">{step.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}
