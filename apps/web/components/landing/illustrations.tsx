import type { CSSProperties } from "react";
import { Blocked, Check, Commit } from "@/components/icons";
import {
  ClaudeLogo,
  DiscordLogo,
  GitHubLogo,
  type Logo,
  OpenAILogo,
  OpenCodeLogo,
  SlackLogo,
  SwitchLogo,
} from "@/components/logos";
import { cn } from "@/lib/utils";
import { Parallax } from "./parallax";

const APPS = {
  slack: { label: "Slack", Mark: SlackLogo },
  switch: { label: "Switch", Mark: SwitchLogo },
  github: { label: "GitHub", Mark: GitHubLogo },
  discord: { label: "Discord", Mark: DiscordLogo },
} satisfies Record<string, { label: string; Mark: Logo }>;

const mono = "font-mono text-[11.5px] leading-[18px]";

function Shell({
  app,
  where,
  className,
  children,
}: {
  app: keyof typeof APPS;
  where: string;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  const { label, Mark } = APPS[app];
  return (
    <div className={cn("w-[268px] rounded-xl bg-background-100 p-3.5 text-left depth", className)}>
      <p className="mb-3 flex items-center gap-1.5 text-[11px] leading-4 font-medium text-gray-900">
        <Mark className="size-3 text-gray-1000" />
        <span className="text-gray-1000">{label}</span>· {where}
      </p>
      {children}
    </div>
  );
}

export function Tick({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full bg-green-700 text-white",
        className,
      )}
    >
      <Check className="size-[60%]" strokeWidth={3} />
    </span>
  );
}

function Checks() {
  return (
    <Shell app="slack" where="#tryout-1-opencode" className="w-[244px]">
      <p className="flex items-center gap-2">
        <span className="rounded bg-badge-green px-1.5 text-[11px] leading-[18px] font-semibold tracking-wide text-green-900">
          VERIFIED
        </span>
        <span className={cn(mono, "text-gray-900")}>tryout/opencode-1</span>
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        {["latest", "test", "scope", "passes", "catches"].map((id) => (
          <Tick key={id} className="size-6" />
        ))}
        <span className="ml-auto text-[12px] text-gray-900">5 of 5</span>
      </div>
    </Shell>
  );
}

const ROOMS = [
  { Mark: ClaudeLogo, room: "tryout-1-claude" },
  { Mark: OpenAILogo, room: "tryout-1-codex" },
  { Mark: OpenCodeLogo, room: "tryout-1-opencode" },
];

function Rooms() {
  return (
    <Shell app="switch" where="Tryout #1" className="w-[236px]">
      <ul className="flex flex-col gap-1.5">
        {ROOMS.map(({ Mark, room }) => (
          <li
            key={room}
            className="flex items-center gap-2 rounded-md bg-gray-alpha-100 px-2 py-1.5 text-[12px] leading-4"
          >
            <Mark className="size-3.5" />
            <span className="text-gray-1000">#{room}</span>
            <span className="ml-auto size-1.5 rounded-full bg-green-700" />
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function Approval({ className }: { className?: string }) {
  return (
    <Shell app="slack" where="#hiring" className={cn("w-[280px]", className)}>
      <p className="text-[13px] leading-5 font-semibold">Permission needed</p>
      <p className="mt-0.5 text-[12px] leading-4 text-gray-900">The hiring manager wants to run</p>
      <p className={cn(mono, "mt-2 rounded-md bg-gray-alpha-100 px-2 py-1.5 text-gray-1000")}>
        tryouts hire --agent opencode-1 --issue 1 --sha 9cdd5ef…
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="inline-flex h-7 items-center gap-1 rounded-md bg-gray-1000 px-2.5 text-[12px] font-medium text-background-200">
          <Check className="size-3" strokeWidth={2.5} />
          Allow once
        </span>
        <span className="inline-flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium text-gray-900 shadow-border">
          Deny
        </span>
        <span className="ml-auto text-[11px] text-gray-900">Team lead only</span>
      </div>
    </Shell>
  );
}

function Refusal() {
  return (
    <Shell app="switch" where="invite to #bugs" className="w-[252px]">
      <p className="flex items-center gap-2 text-[13px] leading-5 font-semibold">
        <Blocked className="size-4 text-red-900" />
        Invite refused
      </p>
      <p className={cn(mono, "mt-2 text-red-900")}>
        403: Not authorized to change this room's membership
      </p>
    </Shell>
  );
}

export function GitHubCommit({ className }: { className?: string }) {
  return (
    <Shell app="github" where="tinychunk" className={className}>
      <p className="flex items-center gap-2 text-[13px] leading-5 font-semibold">
        <Commit className="size-4 text-gray-900" />
        Merge tryout/opencode-1
      </p>
      <ul className={cn(mono, "mt-2 border-l border-gray-alpha-400 pl-3 text-gray-900")}>
        <li className="text-gray-1000">Fixes #1</li>
        <li>Referee: sha256:464dacaa…</li>
        <li>Hired: opencode-1 (OpenCode)</li>
        <li>Approved-by: Arjun</li>
      </ul>
    </Shell>
  );
}

export function DiscordReport({ className }: { className?: string }) {
  return (
    <Shell app="discord" where="#bugs" className={cn("w-[264px]", className)}>
      <div className="flex gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#5865f2] text-[12px] font-semibold text-white">
          R
        </span>
        <div className="text-[12.5px] leading-[18px]">
          <p className="font-semibold">Riya</p>
          <p className="text-gray-1000">
            <span className="rounded-[3px] bg-[#5865f2]/20 px-0.5 font-medium text-[#4752c4] dark:text-[#c9cdfb]">
              @bugfixer
            </span>{" "}
            #2 windows() skips the final window
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#131010] ring-1 ring-gray-alpha-400">
          <OpenCodeLogo className="size-3.5 text-white" />
        </span>
        <div className="text-[12.5px] leading-[18px]">
          <p className="flex items-center gap-1.5 font-semibold">
            bugfixer
            <span className="rounded-[3px] bg-[#5865f2] px-1 text-[9px] leading-[14px] font-semibold text-white">
              APP
            </span>
          </p>
          <p className="text-gray-1000">On it: #2.</p>
        </div>
      </div>
    </Shell>
  );
}

const FLOATING: {
  Card: (props: { className?: string }) => React.ReactNode;
  side: "left" | "right";
  top: string;
  inset: number;
  rotate: number;
  depth: number;
  delay: number;
}[] = [
  { Card: Checks, side: "left", top: "10%", inset: 44, rotate: -7, depth: 0.18, delay: 0 },
  { Card: Rooms, side: "left", top: "39%", inset: 4, rotate: 4, depth: 0.32, delay: -2.5 },
  { Card: Approval, side: "left", top: "65%", inset: 30, rotate: -4, depth: 0.12, delay: -5 },
  { Card: GitHubCommit, side: "right", top: "8%", inset: 20, rotate: 6, depth: 0.26, delay: -1.2 },
  { Card: Refusal, side: "right", top: "40%", inset: 56, rotate: -5, depth: 0.14, delay: -3.6 },
  { Card: DiscordReport, side: "right", top: "64%", inset: 8, rotate: 4, depth: 0.3, delay: -6 },
];

export function FloatingCards() {
  return (
    <Parallax className="pointer-events-none absolute inset-0 hidden min-[1200px]:block">
      {FLOATING.map(({ Card, side, top, inset, rotate, depth, delay }) => (
        <div
          key={Card.name}
          className="absolute"
          style={
            {
              top,
              [side === "left" ? "right" : "left"]: `calc(50% + 24vw + ${inset}px)`,
              translate: `0 calc(var(--y, 0) * ${-depth}px)`,
            } as CSSProperties
          }
        >
          <div className="animate-float" style={{ animationDelay: `${delay}s` }}>
            <div
              className="origin-center scale-[0.9] min-[1440px]:scale-100"
              style={{ rotate: `${rotate}deg` }}
            >
              <Card />
            </div>
          </div>
        </div>
      ))}
    </Parallax>
  );
}

export function StackedCards() {
  return (
    <div
      aria-hidden
      className="flex flex-col items-center gap-3 min-[1200px]:hidden md:flex-row md:items-start md:justify-center md:gap-0"
    >
      <Approval className="-rotate-2 md:-mx-2" />
      <GitHubCommit className="rotate-2 md:z-10 md:-mx-2 md:mt-6" />
      <DiscordReport className="-rotate-1 max-md:hidden md:-mx-2" />
    </div>
  );
}
