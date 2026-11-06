import { Scale } from "@/components/icons";
import {
  ClaudeLogo,
  DiscordLogo,
  GitHubLogo,
  type Logo,
  OpenAILogo,
  OpenCodeLogo,
  SlackLogo,
} from "@/components/logos";
import { Band, card, SectionTitle } from "@/components/section";

const PARTS: { marks: Logo[]; name: string; role: string }[] = [
  {
    marks: [ClaudeLogo, OpenAILogo, OpenCodeLogo],
    name: "Claude Code, Codex, OpenCode",
    role: "The candidates. Each fixes the bug its own way.",
  },
  {
    marks: [OpenCodeLogo],
    name: "OpenCode, on a small model",
    role: "Runs the hiring manager and the referee.",
  },
  {
    marks: [Scale],
    name: "The referee's checks",
    role: "Plain code in a locked Docker box. No AI decides who passes.",
  },
  {
    marks: [GitHubLogo],
    name: "GitHub",
    role: "The real code. A hire's merge closes the issue and records the proof in the commit.",
  },
  {
    marks: [SlackLogo],
    name: "Slack",
    role: "Where the team lead hires.",
  },
  {
    marks: [DiscordLogo],
    name: "Discord",
    role: "Where the community reports bugs.",
  },
];

export function Parts() {
  return (
    <Band labelledBy="parts-title">
      <SectionTitle id="parts-title" eyebrow="The pieces" title="What each part does" />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTS.map(({ marks, name, role }) => (
          <li key={name} className={`${card} reveal flex flex-col p-6 md:p-7`}>
            <span className="flex">
              {marks.map((Mark, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: marks are a fixed list
                  key={i}
                  className="-ml-2 grid size-11 place-items-center rounded-xl border border-gray-alpha-300 bg-background-200 first:ml-0"
                >
                  <Mark className="size-5 text-gray-1000" />
                </span>
              ))}
            </span>
            <h3 className="mt-6 text-heading-20">{name}</h3>
            <p className="mt-2 text-copy-16 text-gray-900">{role}</p>
          </li>
        ))}
      </ul>
    </Band>
  );
}
