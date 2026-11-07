import {
  ArrowRight,
  AtSign,
  Chats,
  Check,
  Folders,
  Gauge,
  type Icon,
  Lock,
  Network,
  SquareCheck,
  Terminal,
  Trash,
} from "@/components/icons";
import {
  ClaudeLogo,
  DiscordLogo,
  type Logo,
  OpenAILogo,
  OpenCodeLogo,
  SlackLogo,
  SwitchLogo,
  SwitchWordmark,
} from "@/components/logos";
import { Band, card, SectionTitle } from "@/components/section";
import { SWITCH_SITE, SWITCH_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const TOOLS: { name: string; agent: string; Mark: Logo }[] = [
  { name: "Claude Code", agent: "claude-1", Mark: ClaudeLogo },
  { name: "Codex", agent: "codex-1", Mark: OpenAILogo },
  { name: "OpenCode", agent: "opencode-1", Mark: OpenCodeLogo },
];

const mono = "font-mono text-[12px] leading-[18px]";
const chip =
  "inline-flex items-center gap-2 rounded-lg border border-gray-alpha-300 bg-background-200 px-2.5 py-1.5 text-[13px] leading-4 text-gray-1000 shadow-[0_8px_16px_-8px_hsl(228_40%_2%/0.5)]";

function Spawn() {
  return (
    <div className="flex w-full max-w-[460px] flex-col items-center">
      <span className={cn(chip, "font-medium")}>
        <SwitchLogo className="size-4" />
        hiring manager
        <code className="rounded bg-gray-alpha-200 px-1 font-mono text-[11px] text-gray-900">
          run_template
        </code>
      </span>
      <span className="h-5 w-px bg-gray-alpha-500" />
      <div className="relative grid w-full grid-cols-3">
        <span className="absolute inset-x-[16.67%] top-0 h-px bg-gray-alpha-500" />
        {TOOLS.map(({ agent, Mark }) => (
          <div key={agent} className="flex flex-col items-center">
            <span className="h-5 w-px bg-gray-alpha-500" />
            <span className={cn(chip, "flex-col gap-1 px-3 py-2")}>
              <span className="flex items-center gap-1.5 font-medium">
                <Mark className="size-3.5" />
                {agent}
              </span>
              <span className={cn(mono, "text-[11px] whitespace-nowrap text-gray-900")}>
                #tryout-1-{agent.replace("-1", "")}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Yaml() {
  const key = "text-blue-900";
  const value = "text-green-900";
  return (
    <pre
      className={cn(mono, "rounded-lg border border-gray-alpha-300 bg-background-200 px-4 py-3")}
    >
      <span className={key}>tryout</span>:{"\n"}
      {"  "}
      <span className={key}>type</span>: <span className={value}>group</span>
      {"\n  "}
      <span className={key}>name</span>: <span className={value}>"Tryout #{"{issue}"}"</span>
      {"\n"}
      <span className={key}>claude</span>:{"\n  "}
      <span className={key}>type</span>: <span className={value}>agent</span>
      {"\n  "}
      <span className={key}>if</span>: <span className={value}>"{"{with_claude}"}"</span>
    </pre>
  );
}

function Machine() {
  return (
    <div className="w-full max-w-[460px] rounded-xl border border-gray-alpha-300 bg-background-200 p-3">
      <p className="flex items-center gap-2 px-1 pb-3 text-[12px] leading-4 text-gray-900">
        <Terminal className="size-3.5" />
        One machine · one Switch agent controller
      </p>
      <div className="grid grid-cols-3 gap-2">
        {TOOLS.map(({ name, Mark }) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-alpha-300 bg-background-100 px-2 py-3"
          >
            <Mark className="size-6" />
            <span className="text-[12.5px] leading-4 font-medium">{name}</span>
            <span className="flex items-center gap-1 text-[11px] text-green-900">
              <span className="size-1.5 rounded-full bg-green-700" />
              same rules
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Budgets() {
  const rows = TOOLS.map((tool, i) => ({ ...tool, used: [24, 46, 100][i] ?? 0 }));
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3">
      {rows.map(({ agent, Mark, used }) => (
        <div key={agent} className="flex items-center gap-2.5">
          <Mark className="size-3.5" />
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-alpha-300">
            <span
              className={cn(
                "block h-full rounded-full",
                used === 100 ? "bg-red-800" : "bg-gray-1000",
              )}
              style={{ width: `${used}%` }}
            />
          </span>
          <span
            className={cn(
              "w-14 text-right text-[11.5px] leading-4",
              used === 100 ? "font-medium text-red-900" : "text-gray-900",
            )}
          >
            {used === 100 ? "stopped" : `${used}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

function Approve() {
  return (
    <div className="w-full max-w-[280px] rounded-xl border border-gray-alpha-300 bg-background-200 p-3.5">
      <p className="text-[12px] leading-4 text-gray-900">The hiring manager wants to run</p>
      <p className={cn(mono, "mt-1.5 text-gray-1000")}>tryouts hire --agent opencode-1 …</p>
      <div className="mt-3 flex gap-1.5">
        <span className="inline-flex h-7 items-center gap-1 rounded-md bg-gray-1000 px-2.5 text-[12px] font-medium text-background-200">
          <Check className="size-3" strokeWidth={2.5} />
          Allow once
        </span>
        <span className="inline-flex h-7 items-center rounded-md border border-gray-alpha-400 px-2.5 text-[12px] font-medium text-gray-900">
          Deny
        </span>
      </div>
    </div>
  );
}

function Door() {
  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-2.5">
      <span className={chip}>
        <OpenCodeLogo className="size-3.5" />
        opencode-1
        <ArrowRight className="size-3.5 text-gray-900" />
        <Lock className="size-3.5" />
        #bugs
      </span>
      <span className={cn(mono, "rounded-md bg-red-100 px-2 py-1 text-center text-red-900")}>
        403: Not authorized to change
        <br />
        this room's membership
      </span>
    </div>
  );
}

function Alias() {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="flex items-center gap-2">
        <span className={chip}>
          <OpenCodeLogo className="size-3.5" />
          opencode-1
        </span>
        <ArrowRight className="size-4 text-gray-900" />
        <span className={cn(chip, "border-blue-400 bg-blue-100 font-medium text-blue-900")}>
          @bugfixer
        </span>
      </span>
      <code className={cn(mono, "text-gray-900")}>!set-alias @opencode-1 @bugfixer</code>
    </div>
  );
}

function Delete() {
  const line = "flex items-baseline gap-2 text-[12.5px] leading-[18px]";
  return (
    <div className="flex w-full max-w-[290px] flex-col gap-2 rounded-xl border border-gray-alpha-300 bg-background-200 p-3.5">
      <p className={line}>
        <span className="shrink-0 font-semibold">hiring</span>
        <span className="text-gray-900">asks to delete codex-1</span>
      </p>
      <p className={line}>
        <span className="shrink-0 font-semibold">Arjun</span>
        <code className={cn(mono, "text-gray-1000")}>!delete-agent codex-1 confirm</code>
      </p>
      <p className={cn(line, "text-green-900")}>
        <Check className="size-3.5 translate-y-0.5" strokeWidth={2.5} />
        Deleted codex-1
      </p>
    </div>
  );
}

function Bridges() {
  const side = (Mark: Logo, app: string, room: string, who: string) => (
    <span className={cn(chip, "flex-col items-start gap-1 px-3 py-2.5")}>
      <span className="flex items-center gap-1.5 font-medium">
        <Mark className="size-4" />
        {app}
      </span>
      <span className="text-[11.5px] text-gray-900">
        {room} · {who}
      </span>
    </span>
  );
  return (
    <div className="flex w-full max-w-[520px] items-center">
      {side(SlackLogo, "Slack", "#hiring", "the team")}
      <span className="h-px flex-1 bg-[length:8px_1px] bg-repeat-x [background-image:linear-gradient(to_right,var(--ds-gray-alpha-500)_50%,transparent_50%)] motion-safe:animate-[dash_1s_linear_infinite]" />
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-gray-alpha-400 bg-gray-1000 text-background-200">
        <SwitchLogo className="size-6" />
      </span>
      <span className="h-px flex-1 bg-[length:8px_1px] bg-repeat-x [background-image:linear-gradient(to_right,var(--ds-gray-alpha-500)_50%,transparent_50%)] motion-safe:animate-[dash_1s_linear_infinite_reverse]" />
      {side(DiscordLogo, "Discord", "#bugs", "the community")}
    </div>
  );
}

const FEATURES: {
  Icon: Icon;
  name: string;
  use: string;
  without: string;
  Visual: () => React.ReactNode;
  wide?: boolean;
  side?: boolean;
}[] = [
  {
    Icon: Network,
    name: "Agents that create agents",
    use: "The hiring manager creates every candidate and its room from one message, with run_template.",
    without: "Set up three agents and three channels by hand, every time.",
    Visual: Spawn,
    wide: true,
  },
  {
    Icon: SquareCheck,
    name: "Approval buttons",
    use: "The hire and every merge wait for the owner's “Allow once”. Tryouts double-checks Switch's record before it merges.",
    without: "A bot with merge rights, or someone copying commands.",
    Visual: Approve,
  },
  {
    Icon: Gauge,
    name: "Usage and budgets",
    use: "Real token counts on the scoreboard. Past its budget, an agent gets no more messages.",
    without: "Cost is a guess, and nothing caps an agent.",
    Visual: Budgets,
  },
  {
    Icon: Lock,
    name: "Room ownership and addressing",
    use: "The hire can't push itself into someone else's room, and strangers in that room can't give it work.",
    without: "One bot can post anywhere, and anyone can instruct it.",
    Visual: Door,
  },
  {
    Icon: Trash,
    name: "Owner-confirmed deletion",
    use: "The candidates who lost are deleted only when the owner confirms.",
    without: "Cleanup by hand, or agents deleting each other.",
    Visual: Delete,
  },
  {
    Icon: Folders,
    name: "Templates with conditions and room groups",
    use: "One template picks any mix of tools. The rooms are filed together as “Tryout #1”.",
    without: "A separate setup for every mix of tools.",
    Visual: Yaml,
  },
  {
    Icon: Chats,
    name: "Slack and Discord bridges",
    use: "The team hires in Slack. The community reports bugs in Discord. One workflow covers both.",
    without: "Two bots, two codebases.",
    Visual: Bridges,
    wide: true,
    side: true,
  },
  {
    Icon: Terminal,
    name: "One machine, three AI tools",
    use: "Claude Code, Codex and OpenCode run under one Switch agent controller, with the same rules.",
    without: "Three tools, three setups.",
    Visual: Machine,
    wide: true,
    side: true,
  },
  {
    Icon: AtSign,
    name: "Aliases",
    use: "The hire answers to @bugfixer, whichever tool won.",
    without: "Renaming bots by hand.",
    Visual: Alias,
  },
];

export function SwitchStrengths() {
  return (
    <Band id="switch" labelledBy="switch-title" className="overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(50%_60%_at_50%_0%,hsl(var(--glow)/0.14),transparent_70%)]"
      />
      <a
        href={SWITCH_SITE}
        aria-label="Switch AI"
        className="reveal mx-auto mb-10 flex w-fit text-gray-1000 transition-opacity hover:opacity-80"
      >
        <SwitchWordmark className="h-9 w-auto md:h-11" />
      </a>
      <SectionTitle
        id="switch-title"
        eyebrow="Built on Switch"
        title="Why Switch makes this possible"
        center
      >
        Tryouts is a thin layer. The hard parts are Switch features: agents that set up other
        agents, budgets, approval buttons and room rules. Here are the nine it leans on.
      </SectionTitle>
      <ul className="mt-16 grid grid-flow-dense gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, name, use, without, Visual, wide, side }) => (
          <li
            key={name}
            className={cn(
              card,
              "reveal flex flex-col overflow-hidden transition-colors hover:border-gray-alpha-500",
              wide && "md:col-span-2",
              side && "lg:flex-row",
            )}
          >
            <div
              className={cn(
                "relative flex h-[210px] items-center justify-center overflow-hidden border-b border-gray-alpha-200 bg-dots px-6",
                wide && !side && "lg:h-[270px]",
                side && "lg:h-auto lg:w-[58%] lg:shrink-0 lg:border-r lg:border-b-0",
              )}
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,hsl(var(--glow)/0.1),transparent_70%)]"
              />
              <div aria-hidden className="relative flex w-full justify-center py-6">
                <Visual />
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 md:p-7">
              <h3 className="flex items-center gap-2.5 text-heading-20">
                <Icon className="size-5 shrink-0 text-gray-900" />
                {name}
              </h3>
              <p className="mt-3 text-copy-16 text-gray-900">{use}</p>
              <p className="mt-auto pt-6">
                <span className="flex gap-2 border-t border-dashed border-gray-alpha-400 pt-4 text-copy-15 text-gray-900">
                  <span className="font-medium whitespace-nowrap text-gray-1000">Without it:</span>
                  <span>{without}</span>
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="reveal mt-10 text-center text-copy-16 text-gray-900">
        Switch is made by SandboxAQ, and its code is public.{" "}
        <a
          href={SWITCH_URL}
          className="inline-flex items-center gap-1 text-gray-1000 underline-offset-4 hover:underline"
        >
          <SwitchLogo className="size-4" />
          See Switch on GitHub <ArrowRight className="size-3.5" />
        </a>
      </p>
    </Band>
  );
}
