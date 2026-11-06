"use client";

import type { App, Approval, FeedItem } from "@tryouts/kit/record";
import { motion, useReducedMotion } from "motion/react";
import { Lock } from "@/components/icons";
import { clock, ms } from "@/lib/format";
import { cn } from "@/lib/utils";
import { APP_LABEL, AppGlyph } from "./app-glyph";
import { RichText } from "./feed-parts";
import { Ticker } from "./ticker";

export type ApprovalState = "open" | "answered" | "closed";

const DENY = /reject|deny|don't|no\b/i;

export function ApprovalCard({
  approval,
  agent,
  owner,
  state,
  app,
  at,
  recommendation,
  refused,
  className,
}: {
  approval: Approval;
  agent: string;
  owner: string;
  state: ApprovalState;
  app: App | null;
  at: number;
  recommendation?: FeedItem | null;
  refused?: string | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const denied = state === "answered" && !!approval.answer && DENY.test(approval.answer);
  const edge = state === "open" ? "bg-hold" : state === "closed" || denied ? "bg-ink-3" : "bg-go";
  return (
    <motion.section
      aria-labelledby="approval-title"
      animate={refused && !reduce ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.28, ease: [0.65, 0, 0.35, 1] }}
      className={cn("relative overflow-hidden rounded-panel bg-raised shadow-raised", className)}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-0.5", edge)} />
      <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="caps flex items-center gap-1.5 text-ink-3">
          Approval ·
          <AppGlyph app={app} label={false} className="size-3 text-ink-2" />
          {app ? APP_LABEL[app] : "Switch"} #{approval.room}
        </span>
        <span className="num ml-auto text-[12px] text-ink-3">
          {state === "open" ? (
            <>
              waiting <Ticker from={ms(approval.askedAt)} until={null} at={at} />
            </>
          ) : (
            approval.answeredAt && (
              <>
                answered after {Math.round((ms(approval.answeredAt) - ms(approval.askedAt)) / 1000)}
                s
              </>
            )
          )}
        </span>
      </header>
      <div className="px-4 pt-3 pb-4">
        <h2 id="approval-title" className="h3">
          {state === "open"
            ? "Permission needed"
            : state === "closed"
              ? "Closed"
              : "Permission answered"}
        </h2>
        <p className="mt-1 text-[13px] text-ink-3">
          <span className="mono text-ink-2">{agent}</span> wants to run
        </p>
        <pre className="mono mt-1.5 rounded-control bg-sunken px-3 py-2 text-[12px] leading-[17px] break-all whitespace-pre-wrap text-ink">
          {approval.command}
        </pre>
        {recommendation && (
          <blockquote className="mt-3 text-[13px] leading-[19px] text-ink-2">
            “<RichText text={recommendation.text} />”{" "}
            <span className="mono text-[12px] text-ink-3">— {recommendation.actor}</span>
          </blockquote>
        )}
        <fieldset className="mt-3 flex flex-wrap gap-1.5">
          <legend className="sr-only">The options Switch sent. Only the owner can choose.</legend>
          {approval.options.map((option, i) => {
            const chosen = state === "answered" && option === approval.answer;
            return (
              <button
                key={option}
                type="button"
                disabled
                aria-disabled
                className={cn(
                  "h-8 rounded-control px-3 text-[13px] font-semibold",
                  chosen
                    ? denied
                      ? "bg-ink-3 text-on-ink"
                      : "bg-go text-[#0c0d10]"
                    : state === "answered"
                      ? "text-ink-4 shadow-[inset_0_0_0_1px_var(--line)]"
                      : "text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]",
                )}
              >
                <span className="mono mr-1.5 text-[11px] opacity-60">{i + 1}</span>
                {option}
              </button>
            );
          })}
        </fieldset>
        {state === "answered" && approval.answeredAt && (
          <p
            className={cn("mt-3 text-[13px] font-semibold", denied ? "text-ink-2" : "text-go-ink")}
          >
            {denied ? "Not hired" : approval.answer} · chosen by {approval.answeredBy ?? owner} ·{" "}
            <time dateTime={approval.answeredAt}>{clock(approval.answeredAt)}</time>
            {app ? ` · ${APP_LABEL[app]}` : ""}
          </p>
        )}
        {refused && (
          <p role="status" className="mt-3 text-[13px] font-semibold text-stop-ink">
            {refused}
          </p>
        )}
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-2">
          <Lock className="size-3.5 text-ink" />
          Only {owner}, {agent}'s owner, can answer this card. Switch enforces it.
        </p>
      </div>
    </motion.section>
  );
}
