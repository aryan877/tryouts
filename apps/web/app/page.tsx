import { Architecture } from "@/components/landing/architecture";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Parts } from "@/components/landing/parts";
import { Setup } from "@/components/landing/setup";
import { SwitchStrengths } from "@/components/landing/switch";
import { Band, Eyebrow } from "@/components/section";

const LIMITS = [
  "All candidates run on one machine as the same user.",
  "Anyone in the bugs room can invite an agent; Switch only stops agents from inviting themselves.",
  "Token counts arrive when a turn ends.",
  "Dollar figures are estimates at list prices.",
  "One bug is a sample of one.",
];

export default function Home() {
  return (
    <>
      <Hero />
      <Band labelledBy="problem-title">
        <div className="reveal mx-auto max-w-[920px] text-center">
          <Eyebrow>The problem</Eyebrow>
          <p id="problem-title" className="mt-6 text-display-36 text-balance md:text-display-56">
            Teams pick an AI coding tool from a demo or a hunch, then live with it.{" "}
            <span className="text-gray-800">
              Nobody tests them side by side on their own code, with the same rules, and keeps the
              receipts.
            </span>
          </p>
        </div>
      </Band>
      <HowItWorks />
      <Architecture />
      <SwitchStrengths />
      <Parts />
      <Setup />
      <Band labelledBy="limits-title">
        <div className="reveal grid gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-12">
          <h2 id="limits-title" className="text-heading-20 text-gray-1000">
            Limits, said plainly
          </h2>
          <ul className="flex flex-col gap-2.5 text-copy-15 text-gray-900">
            {LIMITS.map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-[10px] size-1 shrink-0 rounded-full bg-gray-700" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Band>
    </>
  );
}
