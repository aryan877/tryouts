import { Play } from "@/components/icons";
import { ClaudeLogo, DiscordLogo, OpenAILogo, OpenCodeLogo, SlackLogo } from "@/components/logos";
import { SWITCH_URL, VIDEO_URL, youtubeId } from "@/lib/site";
import { Composer } from "./composer";
import { FloatingCards, StackedCards } from "./illustrations";

export const CANDIDATES = [
  { name: "Claude Code", Mark: ClaudeLogo },
  { name: "Codex", Mark: OpenAILogo },
  { name: "OpenCode", Mark: OpenCodeLogo },
];

function Video() {
  const id = youtubeId(VIDEO_URL);
  return (
    <div id="video" className="container-page scroll-mt-20 pt-16 pb-24 md:pt-20 md:pb-32">
      <div className="reveal mx-auto max-w-[1040px] rounded-[22px] bg-gray-alpha-100 p-1.5 md:p-2">
        <div className="aspect-video overflow-hidden rounded-[16px] bg-background-100 depth">
          {id ? (
            <iframe
              className="size-full"
              src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
              title="Tryouts video"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-5 bg-dots px-6 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-gray-1000 text-background-200 md:size-16">
                <Play className="size-5 translate-x-0.5 md:size-6" />
              </span>
              <div>
                <p className="font-serif text-[28px] leading-8 md:text-[36px] md:leading-10">
                  Video coming soon
                </p>
                <p className="mt-2 text-copy-15 text-gray-900 md:text-copy-16">
                  Until then, the six steps below show how a tryout runs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hero-glow" />
        <FloatingCards />
        <div className="container-page flex min-h-[min(calc(100svh-64px),920px)] flex-col items-center justify-center pt-12 pb-24 text-center">
          <h1
            id="hero-title"
            className="font-serif text-[54px] leading-[54px] tracking-[-0.8px] text-balance md:text-display-84"
          >
            Hire your AI coder <br className="max-md:hidden" />
            like an employee.
          </h1>
          <p className="mt-6 max-w-[540px] text-copy-16 text-pretty text-gray-900 md:text-copy-18">
            Claude Code, Codex and OpenCode try out on the same real bug. A referee checks every fix
            with plain code. Your team lead hires the best one with one button in Slack, and your
            community lets it in on Discord.
          </p>
          <Composer className="mt-10" />
          <ul aria-label="The candidates" className="mt-4 flex flex-wrap justify-center gap-2">
            {CANDIDATES.map(({ name, Mark }) => (
              <li
                key={name}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-gray-alpha-200 px-3 text-label-14 font-medium text-gray-1000"
              >
                <Mark className="size-4" />
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-7 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-label-14 text-gray-900">
            runs in
            <span className="inline-flex items-center gap-1.5 text-gray-1000">
              <SlackLogo className="size-3.5" />
              Slack
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 text-gray-1000">
              <DiscordLogo className="size-3.5" />
              Discord
            </span>
            <span aria-hidden>·</span>
            <a href={SWITCH_URL} className="text-gray-1000 underline-offset-4 hover:underline">
              built on Switch
            </a>
          </p>
          <div className="mt-16 w-full min-[1200px]:hidden">
            <StackedCards />
          </div>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-6 ruler" />
      </div>
      <Video />
    </section>
  );
}
