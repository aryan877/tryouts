"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Check, ChevronDown, Plus } from "@/components/icons";
import { SlackLogo } from "@/components/logos";
import { cn } from "@/lib/utils";

const MENTION = "@hiring";
const MESSAGE = `${MENTION} we need a bug fixer. Hold a tryout on #1 with Claude Code, Codex and OpenCode.`;

export function Composer({ className }: { className?: string }) {
  const [length, setLength] = useState(MESSAGE.length);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let typed = MESSAGE.length;
    const wait = (ms: number, next: () => void) => {
      timer = window.setTimeout(next, ms);
    };
    const type = () => {
      typed += 1;
      setLength(typed);
      if (typed < MESSAGE.length) wait(MESSAGE[typed] === " " ? 70 : 24 + Math.random() * 36, type);
      else wait(700, send);
    };
    const clear = () => {
      setSent(false);
      typed = 0;
      setLength(0);
      wait(600, type);
    };
    const send = () => {
      setSent(true);
      wait(3600, clear);
    };
    wait(1600, send);
    return () => window.clearTimeout(timer);
  }, []);

  const text = MESSAGE.slice(0, length);
  return (
    <figure
      className={cn("w-full max-w-[620px] rounded-[18px] bg-gray-alpha-100 p-1", className)}
      aria-label={`A job post in Slack: ${MESSAGE}`}
    >
      <div aria-hidden className="rounded-[14px] bg-background-100 text-left depth">
        <div className="grid px-4 pt-4 pb-3 text-[17px] leading-7">
          <p className="invisible col-start-1 row-start-1">{MESSAGE}</p>
          <p
            className={cn(
              "col-start-1 row-start-1 text-gray-1000 transition-opacity duration-500",
              sent && "opacity-50",
            )}
          >
            {text.length > 0 && (
              <span className="rounded-[4px] bg-blue-200 px-0.5 text-blue-900">
                {text.slice(0, MENTION.length)}
              </span>
            )}
            {text.slice(MENTION.length)}
            {!sent && (
              <span className="ml-px inline-block h-5 w-[2px] translate-y-[3px] bg-gray-1000 motion-safe:animate-caret" />
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 pb-3">
          <span className="grid size-7 place-items-center rounded-full bg-gray-alpha-200 text-gray-1000">
            <Plus className="size-3.5" />
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 text-label-14 font-medium text-gray-1000">
            <SlackLogo className="size-3.5" />
            #hiring
            <ChevronDown className="size-3.5 text-gray-900" />
          </span>
          <span
            className={cn(
              "ml-auto text-label-13 text-gray-900 transition-opacity duration-300",
              !sent && "opacity-0",
            )}
          >
            Sent to #hiring
          </span>
          <span
            className={cn(
              "grid size-7 place-items-center rounded-md transition-colors duration-300",
              sent ? "bg-green-700 text-white" : "bg-gray-1000 text-background-200",
            )}
          >
            {sent ? (
              <Check className="size-3.5" strokeWidth={2.5} />
            ) : (
              <ArrowUp className="size-3.5" strokeWidth={2.25} />
            )}
          </span>
        </div>
      </div>
    </figure>
  );
}
