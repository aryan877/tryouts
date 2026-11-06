import { AGENTS } from "@tryouts/kit";
import type { TryoutRecord } from "@tryouts/kit/record";
import { Lock } from "@/components/icons";
import { APP_LABEL, AppGlyph } from "@/components/tryouts/app-glyph";
import { Bib, bibColor } from "@/components/tryouts/bib";
import { CheckLights } from "@/components/tryouts/check-lights";
import { RichText } from "@/components/tryouts/feed-parts";
import { appOf, lightsOf, ownerOf } from "@/lib/board";
import { clock, ms } from "@/lib/format";
import { cn } from "@/lib/utils";

function Crop({ children, screen = false }: { children: React.ReactNode; screen?: boolean }) {
  return (
    <div
      className={cn(
        "aspect-[4/3] overflow-hidden rounded-control p-4",
        screen ? "screen shadow-[0_0_0_1px_var(--screen-line)]" : "bg-surface shadow-panel",
      )}
    >
      {children}
    </div>
  );
}

function JobCrop({ record }: { record: TryoutRecord }) {
  const reply = record.feed.find(
    (item) => item.actor === AGENTS.hiring.name && ms(item.at) >= ms(record.posted.at),
  );
  const app = appOf(record, record.posted.room);
  return (
    <Crop>
      <p className="caps flex items-center gap-1.5 text-ink-3">
        <AppGlyph app={app} label={false} className="size-3 text-ink-2" />
        {app ? APP_LABEL[app] : "Switch"} · #{record.posted.room}
      </p>
      <div className="mt-3 flex gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-on-ink">
          {record.posted.by.slice(0, 1)}
        </span>
        <div className="min-w-0 text-[13px] leading-[18px]">
          <p>
            <span className="font-semibold">{record.posted.by}</span>{" "}
            <span className="mono text-[11px] text-ink-3">{clock(record.posted.at)}</span>
          </p>
          <p className="mt-0.5 text-ink-2">{record.posted.text}</p>
        </div>
      </div>
      {reply && (
        <div className="mt-3 flex gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center">
            <span className="size-2.5 rotate-45 rounded-[1px] bg-ink" />
          </span>
          <div className="min-w-0 text-[13px] leading-[18px]">
            <p>
              <span className="mono font-semibold">{reply.actor}</span>{" "}
              <span className="mono text-[11px] text-ink-3">{clock(reply.at)}</span>
            </p>
            <p className="mt-0.5 text-ink-2">
              <RichText text={reply.text} />
            </p>
          </div>
        </div>
      )}
    </Crop>
  );
}

function CreateCrop({ record }: { record: TryoutRecord }) {
  const candidates = [...record.candidates].sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  return (
    <Crop>
      <p className="flex items-center gap-2 text-[13px]">
        <span className="size-2.5 rotate-45 rounded-[1px] bg-ink" />
        <span className="mono font-semibold">{AGENTS.hiring.name}</span>
        <span className="mono ml-auto rounded-chip bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">
          run_template
        </span>
      </p>
      <ol className="mt-2 ml-[4.5px] border-l border-line-strong">
        {candidates.map((c) => (
          <li key={c.agent} className="relative flex items-center gap-2 py-1.5 pl-4 text-[12px]">
            <span className="absolute top-1/2 left-0 h-px w-3 bg-line-strong" />
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: bibColor(c.bib) }}
            />
            <span className="mono font-medium">{c.agent}</span>
            <span className="mono truncate text-ink-3">#{c.room}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] leading-4 text-ink-3">
        One call. {candidates.length} agents, {candidates.length} private rooms, one room group.
      </p>
    </Crop>
  );
}

function RefereeCrop({ record }: { record: TryoutRecord }) {
  return (
    <Crop screen>
      <ul className="flex h-full flex-col justify-center gap-3">
        {record.candidates.map((c) => (
          <li key={c.agent} className="flex items-center gap-2.5">
            <Bib n={c.bib} size={20} />
            <span className="mono w-[92px] truncate text-[12px]">{c.agent}</span>
            <CheckLights lights={lightsOf(c)} size={12} className="ml-auto" />
          </li>
        ))}
      </ul>
    </Crop>
  );
}

function ApprovalCrop({ record }: { record: TryoutRecord }) {
  const approval = record.hire?.approval;
  if (!approval) return <Crop>{null}</Crop>;
  return (
    <Crop>
      <p className="text-[14px] font-semibold">Permission answered</p>
      <p className="mono mt-2 line-clamp-2 rounded-[6px] bg-sunken px-2 py-1.5 text-[10.5px] leading-[15px] break-all text-ink-2">
        {approval.command}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {approval.options.map((option) => (
          <span
            key={option}
            className={cn(
              "rounded-[6px] px-2 py-1 text-[11px] font-semibold",
              option === approval.answer
                ? "bg-go text-[#0c0d10]"
                : "text-ink-3 shadow-[inset_0_0_0_1px_var(--line)]",
            )}
          >
            {option}
          </span>
        ))}
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] leading-4 text-ink-2">
        <Lock className="size-3 shrink-0" />
        Only {ownerOf(record)}, the agent's owner, can answer it.
      </p>
    </Crop>
  );
}

const BEATS = [
  {
    title: "Post the job",
    line: "Arjun asks @hiring in Slack: try Claude Code, Codex and OpenCode on #12.",
    feature: "Switch rooms",
    Crop: JobCrop,
  },
  {
    title: "Hiring creates the candidates",
    line: "One template creates three agents, each in its own room.",
    feature: "Switch: agents create agents",
    Crop: CreateCrop,
  },
  {
    title: "The referee checks everyone the same way",
    line: "Five checks in plain code. No opinions. Switch caps each one's tokens.",
    feature: "Switch: budget per agent",
    Crop: RefereeCrop,
  },
  {
    title: "You hire with one tap",
    line: "The hire waits on a card that only Arjun, the agent's owner, can answer.",
    feature: "Switch: owner-only approval",
    Crop: ApprovalCrop,
  },
];

export function HowItWorks({ record }: { record: TryoutRecord | null }) {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="container-page scroll-mt-20 py-18 lg:py-24"
    >
      <h2 id="how-title" className="h2 max-w-2xl">
        One bug. Three candidates. One hire.
      </h2>
      <ol className="relative mt-12 grid gap-10 lg:grid-cols-4 lg:gap-6">
        <span
          aria-hidden
          className="absolute top-[11px] right-0 left-3 hidden h-px bg-line-strong lg:block"
        />
        <span
          aria-hidden
          className="absolute top-3 bottom-0 left-[11px] w-px bg-line-strong lg:hidden"
        />
        {BEATS.map((beat, i) => (
          <li key={beat.title} className="relative pl-10 lg:pl-0">
            <span className="num absolute top-0 left-0 grid size-6 place-items-center rounded-full bg-ink text-[12px] font-bold text-on-ink lg:relative">
              {i + 1}
            </span>
            <h3 className="mt-0 text-[17px] leading-[22px] font-[650] lg:mt-5 lg:min-h-[44px]">
              {beat.title}
            </h3>
            <p className="mt-1.5 text-[14px] leading-[22px] text-ink-2 lg:min-h-[66px]">
              {beat.line}
            </p>
            {record && (
              <div className="mt-4">
                <beat.Crop record={record} />
              </div>
            )}
            <p className="caps mt-3 text-ink-3">{beat.feature}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
