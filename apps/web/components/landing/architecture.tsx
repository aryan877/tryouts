"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import {
  Chats,
  Check,
  Folders,
  Gauge,
  type Icon,
  Lock,
  Scale,
  SquareCheck,
  SwitchIcon,
  Terminal,
} from "@/components/icons";
import {
  ClaudeLogo,
  DiscordLogo,
  GitHubLogo,
  type Logo,
  OpenAILogo,
  OpenCodeLogo,
  SlackLogo,
} from "@/components/logos";
import { Band, SectionTitle } from "@/components/section";
import { cn } from "@/lib/utils";
import styles from "./architecture.module.css";

type NodeId =
  | "arjun"
  | "riya"
  | "switch"
  | "hiring"
  | "referee"
  | "claude"
  | "codex"
  | "opencode"
  | "checks"
  | "github";
type Side = "t" | "r" | "b" | "l";
type End = `${NodeId}.${Side}` | `${NodeId}.${Side}~`;
type Layout = "wide" | "narrow";
type Pt = { x: number; y: number };
type Curve = [Pt, Pt, Pt, Pt];
type Tone = "blue" | "green" | "red";

const EDGES = {
  post: { wide: ["arjun.r", "switch.l~"], narrow: ["arjun.b", "switch.t~"] },
  door: { wide: ["switch.l~", "riya.r"], narrow: ["switch.t~", "riya.b"] },
  handoff: { wide: ["switch.r~", "hiring.l"], narrow: ["switch.b~", "hiring.t"] },
  spawnClaude: { wide: ["hiring.r", "claude.l"], narrow: ["hiring.b", "claude.t"] },
  spawnCodex: { wide: ["hiring.r", "codex.l"], narrow: ["hiring.b", "codex.t"] },
  spawnOpencode: { wide: ["hiring.r", "opencode.l"], narrow: ["hiring.b", "opencode.t"] },
  fixClaude: { wide: ["claude.r", "referee.l"], narrow: ["claude.b", "referee.t"] },
  fixCodex: { wide: ["codex.r", "referee.l"], narrow: ["codex.b", "referee.t"] },
  fixOpencode: { wide: ["opencode.r", "referee.l"], narrow: ["opencode.b", "referee.t"] },
  check: { wide: ["referee.b", "checks.t~"], narrow: ["referee.b", "checks.t~"] },
  merge: { wide: ["checks.l", "github.r~"], narrow: ["checks.b", "github.t~"] },
} satisfies Record<string, Record<Layout, [End, End]>>;

type EdgeId = keyof typeof EDGES;
const EDGE_IDS = Object.keys(EDGES) as EdgeId[];

const TONE: Record<Tone, string> = {
  blue: "var(--ds-blue-900)",
  green: "var(--ds-green-900)",
  red: "var(--ds-red-900)",
};

const CHIPS = [
  { label: "Rooms", Icon: Chats },
  { label: "Approval buttons", Icon: SquareCheck },
  { label: "Budgets", Icon: Gauge },
  { label: "Templates", Icon: Folders },
  { label: "Room rules", Icon: Lock },
] as const satisfies { label: string; Icon: Icon }[];

type Chip = (typeof CHIPS)[number]["label"];
type Beam = { edge: EdgeId; back?: boolean; delay?: number; tone?: Tone; halt?: number };

const STEPS: {
  caption: string;
  ms: number;
  tone: Tone;
  until?: [Tone, number];
  beams: Beam[];
  lit: Partial<Record<NodeId, number>>;
  chips: Chip[];
  mark: [EdgeId, number];
}[] = [
  {
    caption: "Arjun posts a job in Slack.",
    ms: 1800,
    tone: "blue",
    beams: [{ edge: "post", delay: 250 }],
    lit: { arjun: 0, switch: 900 },
    chips: ["Rooms"],
    mark: ["post", 0.3],
  },
  {
    caption: "Switch hands it to the hiring manager.",
    ms: 1800,
    tone: "blue",
    beams: [{ edge: "handoff" }],
    lit: { switch: 0, hiring: 650 },
    chips: ["Rooms"],
    mark: ["handoff", 0.5],
  },
  {
    caption: "The hiring manager creates three candidates.",
    ms: 2000,
    tone: "blue",
    beams: [{ edge: "spawnClaude" }, { edge: "spawnCodex" }, { edge: "spawnOpencode" }],
    lit: { hiring: 0, claude: 600, codex: 680, opencode: 760 },
    chips: ["Templates", "Budgets"],
    mark: ["spawnCodex", 0.5],
  },
  {
    caption: "Each fix goes to the referee: same 5 checks, plain code.",
    ms: 2400,
    tone: "green",
    beams: [
      { edge: "fixClaude" },
      { edge: "fixCodex" },
      { edge: "fixOpencode" },
      { edge: "check", delay: 750 },
    ],
    lit: { claude: 0, codex: 0, opencode: 0, referee: 650, checks: 1350 },
    chips: [],
    mark: ["fixCodex", 0.5],
  },
  {
    caption: "The hire is a button only Arjun can press.",
    ms: 2000,
    tone: "blue",
    beams: [{ edge: "post", back: true }],
    lit: { switch: 0, arjun: 650 },
    chips: ["Approval buttons"],
    mark: ["post", 0.7],
  },
  {
    caption: "The checked code merges on GitHub and closes the issue.",
    ms: 1800,
    tone: "green",
    beams: [{ edge: "merge" }],
    lit: { checks: 0, github: 650 },
    chips: [],
    mark: ["merge", 0.5],
  },
  {
    caption: "Switch keeps the hire out of #bugs until Riya lets it in.",
    ms: 2600,
    tone: "green",
    until: ["red", 1250],
    beams: [
      { edge: "door", tone: "red", halt: 0.5 },
      { edge: "door", delay: 1150 },
    ],
    lit: { switch: 0, riya: 1800 },
    chips: ["Room rules"],
    mark: ["door", 0.5],
  },
];

const OUT: Record<Side, Pt> = {
  t: { x: 0, y: -1 },
  r: { x: 1, y: 0 },
  b: { x: 0, y: 1 },
  l: { x: -1, y: 0 },
};

type Box = { x: number; y: number; w: number; h: number };
type Geometry = { w: number; h: number; curves: Record<EdgeId, Curve> };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function anchor(box: Box, side: Side, toward?: Pt): Pt {
  const inset = 16;
  if (side === "l" || side === "r") {
    return {
      x: side === "l" ? box.x : box.x + box.w,
      y: toward ? clamp(toward.y, box.y + inset, box.y + box.h - inset) : box.y + box.h / 2,
    };
  }
  return {
    x: toward ? clamp(toward.x, box.x + inset, box.x + box.w - inset) : box.x + box.w / 2,
    y: side === "t" ? box.y : box.y + box.h,
  };
}

function curve(a: Pt, from: Side, b: Pt, to: Side): Curve {
  const pull = (side: Side) =>
    Math.max(16, (side === "l" || side === "r" ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y)) / 2);
  const reach = (p: Pt, side: Side) => ({
    x: p.x + OUT[side].x * pull(side),
    y: p.y + OUT[side].y * pull(side),
  });
  return [a, reach(a, from), reach(b, to), b];
}

function pointAt([p0, p1, p2, p3]: Curve, t: number): Pt {
  const u = 1 - t;
  const mix = (k: "x" | "y") =>
    u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k];
  return { x: mix("x"), y: mix("y") };
}

const svgPath = (c: Curve) =>
  `M${c.map((p, i) => `${i === 1 ? "C" : ""}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")}`;

function parse(end: End) {
  const [node, side] = end.replace("~", "").split(".") as [NodeId, Side];
  return { node, side, follow: end.endsWith("~") };
}

function measure(stage: HTMLElement): Geometry {
  const base = stage.getBoundingClientRect();
  const scale = base.width / stage.offsetWidth || 1;
  const layout: Layout = matchMedia("(min-width: 900px)").matches ? "wide" : "narrow";
  const box = (id: NodeId): Box => {
    const r = stage.querySelector(`[data-node="${id}"]`)?.getBoundingClientRect();
    return r
      ? {
          x: (r.left - base.left) / scale,
          y: (r.top - base.top) / scale,
          w: r.width / scale,
          h: r.height / scale,
        }
      : { x: 0, y: 0, w: 0, h: 0 };
  };
  const curves = {} as Record<EdgeId, Curve>;
  for (const id of EDGE_IDS) {
    const [first, second] = EDGES[id][layout];
    const from = parse(first);
    const to = parse(second);
    const fixedA = from.follow ? undefined : anchor(box(from.node), from.side);
    const fixedB = to.follow ? undefined : anchor(box(to.node), to.side);
    const a = fixedA ?? anchor(box(from.node), from.side, fixedB);
    const b = fixedB ?? anchor(box(to.node), to.side, a);
    curves[id] = curve(a, from.side, b, to.side);
  }
  return { w: stage.offsetWidth, h: stage.offsetHeight, curves };
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;

const TRAIL: [length: number, width: number, opacity: number][] = [
  [0.42, 1.5, 0.25],
  [0.2, 2.25, 0.55],
  [0.06, 3, 0.95],
  [0.0001, 7.5, 1],
];

function Comet({
  curve: c,
  beam,
  tone,
  glow,
}: {
  curve: Curve;
  beam: Beam;
  tone: Tone;
  glow: string;
}) {
  const d = svgPath(beam.back ? [c[3], c[2], c[1], c[0]] : c);
  const style = vars({
    "--tone": TONE[beam.tone ?? tone],
    "--delay": `${beam.delay ?? 0}ms`,
    "--ms": beam.halt ? "750ms" : "1050ms",
    "--to": beam.halt ?? 1.44,
  });
  const className = cn(styles.beam, beam.halt && styles.halt);
  return (
    <g style={style} filter={`url(#${glow})`}>
      {TRAIL.map(([length, width, opacity]) => (
        <path
          key={length}
          d={d}
          pathLength={1}
          className={className}
          style={vars({ "--l": length })}
          strokeWidth={width}
          strokeOpacity={opacity}
        />
      ))}
      <path
        d={d}
        pathLength={1}
        className={className}
        style={vars({ "--l": 0.0001, "--tone": "#fff" })}
        strokeWidth={3}
      />
    </g>
  );
}

function Wires({ geo, step, run }: { geo: Geometry; step: number; run: number }) {
  const glow = `glow${useId().replace(/[^\w]/g, "")}`;
  const current = STEPS[step];
  const lit = new Set(current?.beams.map((beam) => beam.edge));
  const ports = new Map<string, { p: Pt; lit: boolean }>();
  for (const id of EDGE_IDS) {
    const c = geo.curves[id];
    for (const p of [c[0], c[3]]) {
      const key = `${Math.round(p.x)}:${Math.round(p.y)}`;
      ports.set(key, { p, lit: (ports.get(key)?.lit ?? false) || lit.has(id) });
    }
  }
  return (
    <svg
      aria-hidden
      width={geo.w}
      height={geo.h}
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
    >
      <defs>
        <filter
          id={glow}
          filterUnits="userSpaceOnUse"
          x={-40}
          y={-40}
          width={geo.w + 80}
          height={geo.h + 80}
        >
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {EDGE_IDS.map((id) => (
        <path
          key={id}
          d={svgPath(geo.curves[id])}
          className={styles.line}
          data-lit={lit.has(id) ? "" : undefined}
        />
      ))}
      {[...ports].map(([key, port]) => (
        <circle
          key={key}
          cx={port.p.x}
          cy={port.p.y}
          r={3}
          className={styles.port}
          data-lit={port.lit ? "" : undefined}
        />
      ))}
      {current?.beams.map((beam) => (
        <Comet
          key={`${run}-${step}-${beam.edge}-${beam.delay ?? 0}`}
          curve={geo.curves[beam.edge]}
          beam={beam}
          tone={current.tone}
          glow={glow}
        />
      ))}
    </svg>
  );
}

function Node({
  id,
  lit,
  className,
  children,
}: {
  id: NodeId;
  lit: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-node={id}
      data-lit={lit ? "" : undefined}
      className={cn(styles.node, "relative z-20 rounded-xl bg-background-100 depth", className)}
    >
      {children}
    </div>
  );
}

function Flash({
  className,
  delay,
  until,
  kind = "pop",
  children,
}: {
  className?: string;
  delay?: number;
  until?: number;
  kind?: "pop" | "brief" | "press";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(styles[kind], "absolute z-30", className)}
      style={vars({ "--delay": `${delay ?? 0}ms`, "--until": `${until ?? 0}ms` })}
    >
      {children}
    </span>
  );
}

function Person({
  id,
  name,
  job,
  initial,
  avatar,
  Mark,
  app,
  room,
  lit,
  className,
  children,
}: {
  id: NodeId;
  name: string;
  job: string;
  initial: string;
  avatar: string;
  Mark: Logo;
  app: string;
  room: string;
  lit: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Node id={id} lit={lit} className={cn("w-full max-w-[220px] p-3 min-[900px]:p-3.5", className)}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-white",
            avatar,
          )}
        >
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] leading-5 font-semibold">{name}</span>
          <span className="block text-[12.5px] leading-4 text-gray-900">{job}</span>
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-gray-alpha-100 px-2.5 py-1.5 text-[12.5px] leading-4 font-medium">
        <Mark className="size-3.5" />
        {app}
        <span className="ml-auto font-mono text-[11.5px] font-normal text-gray-900">{room}</span>
      </p>
      {children}
    </Node>
  );
}

function Agent({
  id,
  name,
  lit,
  className,
}: {
  id: NodeId;
  name: string;
  lit: boolean;
  className?: string;
}) {
  return (
    <Node
      id={id}
      lit={lit}
      className={cn("flex flex-col items-center gap-2 px-3 py-3.5 text-center", className)}
    >
      <span className="grid size-9 place-items-center rounded-lg bg-[#131010] ring-1 ring-gray-alpha-400">
        <OpenCodeLogo className="size-[18px] text-white" />
      </span>
      <span>
        <span className="block text-[13.5px] leading-[18px] font-semibold">{name}</span>
        <span className="block font-mono text-[11px] leading-4 text-gray-900">small model</span>
      </span>
    </Node>
  );
}

const CANDIDATES: { id: NodeId; name: string; Mark: Logo }[] = [
  { id: "claude", name: "Claude Code", Mark: ClaudeLogo },
  { id: "codex", name: "Codex", Mark: OpenAILogo },
  { id: "opencode", name: "OpenCode", Mark: OpenCodeLogo },
];

const GRID =
  "min-[900px]:grid-cols-[minmax(136px,1fr)_minmax(36px,0.5fr)_minmax(150px,1.1fr)_minmax(36px,0.5fr)_minmax(136px,1fr)]";

function Tick({ state, delay }: { state: "idle" | "on" | "still"; delay: number }) {
  return (
    <span
      className={cn(
        "grid size-[18px] place-items-center rounded-full bg-green-700 text-white",
        state === "idle" && styles.idle,
        state === "on" && styles.tick,
      )}
      style={vars({ "--delay": `${delay}ms` })}
    >
      <Check className="size-[11px]" strokeWidth={3} />
    </span>
  );
}

export function Architecture() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [fit, setFit] = useState(1);
  const [play, setPlay] = useState({ step: -1, run: 0 });
  const [clock, setClock] = useState({ run: -1, step: -1, ms: 0 });
  const { step, run } = play;

  useEffect(() => {
    const stage = stageRef.current;
    const panel = stage?.parentElement;
    if (!stage || !panel) return;
    const wide = matchMedia("(min-width: 900px)");
    const update = () => {
      setFit(Math.min(1, panel.clientWidth / stage.offsetWidth));
      setGeo(measure(stage));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    observer.observe(stage);
    for (const node of stage.querySelectorAll("[data-node]")) observer.observe(node);
    wide.addEventListener("change", update);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlay((p) => ({ step: entry?.isIntersecting ? 0 : -1, run: p.run + 1 })),
      { rootMargin: "-15% 0px -15% 0px" },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const current = STEPS[play.step];
    if (!current) return;
    const arrivals = new Set(
      [...Object.values(current.lit), current.until?.[1] ?? 0].filter((ms) => ms > 0),
    );
    const timers = [...arrivals].map((ms) =>
      window.setTimeout(() => setClock({ ...play, ms }), ms),
    );
    timers.push(
      window.setTimeout(
        () => setPlay((p) => ({ step: (p.step + 1) % STEPS.length, run: p.run })),
        current.ms,
      ),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [play]);

  const goTo = (n: number) => setPlay((p) => ({ step: n, run: p.run + 1 }));

  const playing = step >= 0;
  const current = STEPS[Math.max(step, 0)] ?? STEPS[0];
  const elapsed = clock.run === run && clock.step === step ? clock.ms : 0;
  const early = current?.until;
  const tone = early && elapsed < early[1] ? early[0] : (current?.tone ?? "blue");
  const lit = (id: NodeId) => {
    const ms = playing ? current?.lit[id] : undefined;
    return ms !== undefined && ms <= elapsed;
  };
  const at = (n: number) => step === n;
  const after = (n: number) => step > n;
  const door = geo ? pointAt(geo.curves.door, 0.5) : undefined;

  return (
    <Band id="architecture" labelledBy="architecture-title">
      <SectionTitle
        id="architecture-title"
        eyebrow="Architecture"
        title="How it's built"
        center
        className="max-w-[880px]"
      >
        People stay in Slack and Discord. Switch runs the rules. The agents do the work on one
        machine.
      </SectionTitle>

      <figure
        aria-label="How Tryouts is built"
        className="reveal mx-auto mt-10 max-w-[1280px] rounded-[22px] bg-gray-alpha-100 p-1.5 min-[1360px]:-mx-16 md:p-2"
      >
        <div className="relative overflow-hidden rounded-[16px] bg-background-200 depth">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-dots [mask-image:radial-gradient(80%_70%_at_50%_45%,#000,transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(55%_70%_at_50%_0%,hsl(var(--glow)/0.12),transparent_70%)]"
          />

          <div
            ref={stageRef}
            data-playing={playing ? "" : undefined}
            style={vars({
              "--accent": TONE[tone],
              ...(fit < 1 && geo
                ? { scale: String(fit), transformOrigin: "0 0", marginBottom: geo.h * (fit - 1) }
                : {}),
            })}
            className={cn(
              styles.stage,
              "relative grid grid-cols-2 gap-x-3 px-4 pt-16 pb-10 sm:px-8",
              "min-[900px]:min-w-[1094px] min-[900px]:grid-cols-[minmax(180px,0.92fr)_minmax(44px,0.5fr)_minmax(200px,1fr)_minmax(44px,0.5fr)_minmax(546px,3fr)] min-[900px]:grid-rows-[auto_48px_auto] min-[900px]:gap-x-0 min-[900px]:px-10 min-[900px]:pt-10 min-[900px]:pb-10",
            )}
          >
            {geo && <Wires geo={geo} step={step} run={run} />}

            <Person
              id="arjun"
              name="Arjun"
              job="team lead"
              initial="A"
              avatar="bg-[linear-gradient(135deg,#f7b955,#e8590c)]"
              Mark={SlackLogo}
              app="Slack"
              room="#hiring"
              lit={lit("arjun")}
              className="[grid-area:1/1] min-[900px]:self-center"
            >
              {at(0) && (
                <Flash
                  key={run}
                  delay={60}
                  className="bottom-full left-0 mb-2.5 rounded-lg bg-background-100 px-2.5 py-1.5 text-[12px] leading-4 whitespace-nowrap shadow-menu"
                >
                  <span className="rounded-[3px] bg-blue-200 px-0.5 text-blue-900">@hiring</span>{" "}
                  hold a tryout on #1
                </Flash>
              )}
              {at(4) && (
                <Flash
                  key={run}
                  kind="press"
                  delay={650}
                  until={1150}
                  className="-bottom-3.5 right-3 inline-flex h-7 items-center gap-1 rounded-md bg-gray-1000 px-2.5 text-[12px] font-medium text-background-200"
                >
                  <Check className="size-3" strokeWidth={2.75} />
                  Allow once
                </Flash>
              )}
            </Person>

            <Person
              id="riya"
              name="Riya"
              job="community"
              initial="R"
              avatar="bg-[linear-gradient(135deg,#9b8afb,#5865f2)]"
              Mark={DiscordLogo}
              app="Discord"
              room="#bugs"
              lit={lit("riya")}
              className="justify-self-end [grid-area:1/2] min-[900px]:justify-self-auto min-[900px]:self-center min-[900px]:[grid-area:3/1]"
            />

            <Node
              id="switch"
              lit={lit("switch")}
              className="mt-12 flex flex-col gap-4 p-4 [grid-area:2/1/3/3] min-[900px]:mt-0 min-[900px]:justify-center min-[900px]:gap-6 min-[900px]:p-5 min-[900px]:[grid-area:1/3/4/4]"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-1000 text-background-200">
                  <SwitchIcon className="size-5" />
                </span>
                <span>
                  <span className="block text-heading-20">Switch</span>
                  <span className="block font-mono text-[11.5px] leading-4 text-gray-900">
                    on our server
                  </span>
                </span>
              </div>
              <ul className="flex flex-wrap gap-1.5 min-[900px]:flex-col min-[900px]:gap-2">
                {CHIPS.map(({ label, Icon }) => (
                  <li
                    key={label}
                    data-lit={current?.chips.includes(label) && lit("switch") ? "" : undefined}
                    className={cn(
                      styles.chip,
                      "flex items-center gap-2 rounded-lg border border-gray-alpha-300 bg-gray-alpha-100 px-2.5 py-1.5 text-[12.5px] leading-4 text-gray-900 min-[900px]:gap-2.5 min-[900px]:px-3 min-[900px]:py-2 min-[900px]:text-[13px]",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </li>
                ))}
              </ul>
            </Node>

            <div className="relative mt-14 rounded-2xl border border-dashed border-gray-alpha-500 bg-gray-alpha-100 px-3 pt-8 pb-5 [grid-area:3/1/4/3] min-[900px]:mt-0 min-[900px]:px-6 min-[900px]:py-9 min-[900px]:[grid-area:1/5]">
              <p className="absolute top-0 left-4 z-20 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-gray-alpha-400 bg-background-200 px-2.5 py-1 font-mono text-[11px] leading-4 text-gray-1000">
                <Terminal className="size-3.5" />
                team-server
                <span className="text-gray-900">· agent controller</span>
              </p>
              <div
                className={cn(
                  "grid justify-items-center gap-y-12 min-[900px]:items-center min-[900px]:justify-items-stretch min-[900px]:gap-y-0",
                  GRID,
                )}
              >
                <Agent
                  id="hiring"
                  name="Hiring manager"
                  lit={lit("hiring")}
                  className="w-full max-w-[200px] min-[900px]:[grid-column:1]"
                />
                <div className="relative grid w-full grid-cols-3 gap-2 min-[900px]:grid-cols-1 min-[900px]:gap-3 min-[900px]:[grid-column:3]">
                  <span className="absolute -top-6 left-0 font-mono text-[10.5px] leading-4 tracking-[0.12em] text-gray-900 uppercase max-[899px]:hidden">
                    candidates
                  </span>
                  {CANDIDATES.map(({ id, name, Mark }) => (
                    <Node
                      key={id}
                      id={id}
                      lit={lit(id)}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 min-[900px]:h-11 min-[900px]:flex-row min-[900px]:gap-2.5 min-[900px]:px-3 min-[900px]:py-0"
                    >
                      <Mark className="size-[18px]" />
                      <span className="text-[12px] leading-4 font-medium whitespace-nowrap min-[900px]:text-[13.5px]">
                        {name}
                      </span>
                    </Node>
                  ))}
                </div>
                <Agent
                  id="referee"
                  name="Referee"
                  lit={lit("referee")}
                  className="w-full max-w-[200px] min-[900px]:[grid-column:5]"
                />
              </div>
            </div>

            <div className="mt-12 grid justify-items-center gap-y-12 [grid-area:4/1/5/3] min-[900px]:mt-0 min-[900px]:grid-cols-[minmax(160px,1.2fr)_minmax(36px,0.4fr)_minmax(300px,2fr)] min-[900px]:items-stretch min-[900px]:justify-items-stretch min-[900px]:px-[25px] min-[900px]:[grid-area:3/5]">
              <Node
                id="checks"
                lit={lit("checks")}
                className="flex w-full max-w-[380px] items-center gap-3 p-3.5 min-[900px]:max-w-none min-[900px]:[grid-area:1/3]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gray-alpha-200 text-gray-1000">
                  <Scale className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14px] leading-5 font-semibold">
                    Referee checks
                    <span className="rounded-full bg-badge-green px-1.5 text-[10.5px] leading-4 font-semibold tracking-wide text-green-900">
                      NO AI
                    </span>
                  </span>
                  <span className="block text-[12px] leading-4 text-gray-900">
                    plain code · Docker sandbox · 5 checks
                  </span>
                  <span className="mt-2 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Tick
                        key={`${run}-${i}`}
                        state={!playing || after(3) ? "still" : at(3) ? "on" : "idle"}
                        delay={1350 + i * 110}
                      />
                    ))}
                  </span>
                </span>
              </Node>
              <Node
                id="github"
                lit={lit("github")}
                className="row-start-2 flex w-full max-w-[220px] flex-col justify-center gap-2 p-3.5 min-[900px]:max-w-none min-[900px]:[grid-area:1/1]"
              >
                <span className="flex items-center gap-2 text-[14px] leading-5 font-semibold">
                  <GitHubLogo className="size-[18px]" />
                  GitHub
                </span>
                <span className="block text-[12px] leading-4 text-gray-900">
                  <span className="font-mono text-gray-1000">tinychunk</span>
                  <br />
                  merge closes the issue
                </span>
                {at(5) && (
                  <Flash
                    key={run}
                    delay={650}
                    className="-top-3 right-2.5 inline-flex h-6 items-center rounded-full bg-[#8957e5] px-2 text-[11.5px] font-medium text-white"
                  >
                    Merged · #1 closed
                  </Flash>
                )}
              </Node>
            </div>

            {door && at(6) && (
              <span
                key={run}
                className="absolute z-30 size-0"
                style={{ left: door.x, top: door.y }}
              >
                <Flash
                  kind="brief"
                  delay={450}
                  until={1250}
                  className="top-0 left-0 inline-flex h-6 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-red-800 px-2 text-[11.5px] font-medium whitespace-nowrap text-white"
                >
                  Blocked
                </Flash>
                <Flash
                  delay={1450}
                  className="top-0 left-0 inline-flex h-6 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-green-700 px-2 text-[11.5px] font-medium whitespace-nowrap text-white"
                >
                  <Check className="size-3" strokeWidth={2.75} />
                  Let in
                </Flash>
              </span>
            )}

            {geo &&
              STEPS.map(({ caption, mark: [edge, t] }, i) => {
                const p = pointAt(geo.curves[edge], t);
                return (
                  <span
                    key={caption}
                    aria-hidden
                    className="absolute z-30 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gray-1000 font-mono text-[11px] font-medium text-background-200 motion-safe:hidden"
                    style={{ left: p.x, top: p.y }}
                  >
                    {i + 1}
                  </span>
                );
              })}
          </div>

          <div className="relative flex flex-col gap-4 border-t border-gray-alpha-200 bg-background-100/60 px-5 py-4 motion-reduce:hidden sm:flex-row sm:items-center sm:gap-6 sm:px-8">
            <p aria-hidden className="flex min-w-0 flex-1 items-baseline gap-4">
              <span className="font-mono text-[12px] whitespace-nowrap text-gray-1000 tabular-nums">
                {String(Math.max(step, 0) + 1).padStart(2, "0")}
                <span className="text-gray-800"> / {String(STEPS.length).padStart(2, "0")}</span>
              </span>
              <span
                key={`${run}-${step}`}
                className={cn(
                  playing && styles.fade,
                  "font-serif text-[22px] leading-7 text-gray-1000 sm:text-[26px] sm:leading-8",
                )}
              >
                {current?.caption}
              </span>
            </p>
            <div className="flex shrink-0 gap-1">
              {STEPS.map(({ caption, ms }, i) => (
                <button
                  key={caption}
                  type="button"
                  aria-label={`Play from step ${i + 1}: ${caption}`}
                  onClick={() => goTo(i)}
                  className="group grid h-7 w-8 place-items-center rounded-md"
                >
                  <span className="h-[3px] w-full overflow-hidden rounded-full bg-gray-alpha-400 transition-colors group-hover:bg-gray-alpha-500">
                    {(after(i) || at(i)) && (
                      <span
                        key={`${run}-${caption}`}
                        className={cn("block h-full bg-gray-1000", at(i) && styles.fill)}
                        style={vars({ "--ms": `${ms}ms` })}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <ol className="grid gap-x-8 gap-y-2.5 border-t border-gray-alpha-200 px-5 py-5 motion-safe:sr-only sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4 sm:px-8">
            {STEPS.map(({ caption }, i) => (
              <li key={caption} className="flex gap-3 text-copy-15 text-gray-1000">
                <span className="grid size-5 shrink-0 translate-y-0.5 place-items-center rounded-full bg-gray-1000 font-mono text-[11px] font-medium text-background-200">
                  {i + 1}
                </span>
                {caption}
              </li>
            ))}
          </ol>
        </div>
      </figure>
    </Band>
  );
}
