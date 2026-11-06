"use client";

import type { App } from "@tryouts/kit/record";
import type { ProofReport } from "@tryouts/referee";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { ArrowUpRight, Check, Close, Refresh } from "@/components/icons";
import { APP_LABEL, AppGlyph } from "@/components/tryouts/app-glyph";
import { CheckLights } from "@/components/tryouts/check-lights";
import { CHECKS, type LightState } from "@/lib/board";
import { digestOf, evidenceOf } from "@/lib/digest";
import { sha7 } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface Evidence {
  agent: string;
  issue: number;
  room: string;
  app: App | null;
  report: ProofReport;
  merged: { sha: string; url: string | null } | null;
}

interface Result {
  digest: string;
  ms: number;
}

const normal = (value: string) => {
  const hex = value
    .trim()
    .toLowerCase()
    .replace(/^sha256:/, "");
  return /^[0-9a-f]{64}$/.test(hex) ? `sha256:${hex}` : null;
};

function Row({ ok, children, i }: { ok: boolean; children: React.ReactNode; i: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.12 : 0.14, delay: reduce ? 0 : i * 0.12 }}
      className={cn(
        "flex items-start gap-3 border-b border-line py-3 text-[15px] leading-[22px] last:border-b-0",
        !ok && "text-stop-ink",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
          ok ? "bg-go text-[#0c0d10]" : "bg-stop text-on-stop",
        )}
      >
        {ok ? <Check className="size-3.5" /> : <Close className="size-3.5" />}
      </span>
      <span className="min-w-0">{children}</span>
    </motion.li>
  );
}

export function Verifier({ evidence, initial }: { evidence: Evidence[]; initial: string | null }) {
  const [input, setInput] = useState(initial ?? evidence[0]?.report.digest ?? "");
  const [target, setTarget] = useState<Evidence | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (value: string) => {
      const digest = normal(value);
      setResult(null);
      if (!digest) {
        setTarget(null);
        setError("A digest is sha256: followed by 64 hex characters.");
        return;
      }
      const found = evidence.find((e) => e.report.digest === digest) ?? null;
      setTarget(found);
      if (!found) {
        setError("No recorded referee card has that digest.");
        return;
      }
      setError(null);
      const started = performance.now();
      const computed = await digestOf(found.report);
      setResult({ digest: computed, ms: performance.now() - started });
    },
    [evidence],
  );

  useEffect(() => {
    if (initial) run(initial);
  }, [initial, run]);

  const matches = !!result && !!target && result.digest === target.report.digest;
  const lights: LightState[] = target
    ? CHECKS.map(({ id }) => {
        const check = target.report.checks.find((c) => c.id === id);
        return check ? (check.passed ? "pass" : "fail") : "off";
      })
    : [];

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(input);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="digest" className="sr-only">
          Referee digest
        </label>
        <input
          id="digest"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="mono h-12 min-w-0 flex-1 rounded-control bg-surface px-4 text-[13px] text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ink)]"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-ink px-5 text-[15px] font-semibold text-on-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.28)] active:translate-y-px"
        >
          <Refresh className="size-4" />
          Recompute
        </button>
      </form>
      {evidence.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {evidence.map((e) => (
            <button
              key={e.report.digest}
              type="button"
              onClick={() => {
                setInput(e.report.digest);
                run(e.report.digest);
              }}
              className={cn(
                "mono h-7 rounded-chip px-2 text-[12px] transition-colors",
                target?.report.digest === e.report.digest
                  ? "bg-ink text-on-ink"
                  : "text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface-2",
              )}
            >
              #{e.issue} {e.agent}
            </button>
          ))}
        </div>
      )}

      <section aria-live="polite" className="panel mt-6 px-5 py-2">
        <p className="caps pt-2 text-ink-3">Result</p>
        {error && (
          <ul>
            <Row ok={false} i={0}>
              {error}
            </Row>
          </ul>
        )}
        {!error && !result && (
          <p className="py-4 text-[15px] text-ink-3">
            Press Recompute to hash the evidence in your browser.
          </p>
        )}
        <AnimatePresence initial={false}>
          {target && result && (
            <motion.ul key={result.digest + target.agent} initial={false}>
              <Row ok={matches} i={0}>
                {matches ? (
                  <>
                    <strong className="font-semibold">Digest matches.</strong>{" "}
                    <span className="text-ink-2">
                      Computed in your browser from the evidence below in {result.ms.toFixed(1)} ms.
                    </span>
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">Digest doesn't match.</strong> This record was
                    changed after the referee ran.
                  </>
                )}
              </Row>
              <Row ok={matches} i={1}>
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  Same digest as the referee's card in #{target.room}
                  <AppGlyph app={target.app} className="size-3.5" />
                  {target.app ? APP_LABEL[target.app] : ""}
                </span>
              </Row>
              {target.merged && (
                <Row ok i={2}>
                  Commit <span className="mono">{sha7(target.report.head.sha)}</span> merged into
                  main as{" "}
                  {target.merged.url ? (
                    <a
                      href={target.merged.url}
                      className="mono inline-flex items-center underline decoration-line-strong underline-offset-2"
                    >
                      {sha7(target.merged.sha)}
                      <ArrowUpRight className="size-3" />
                    </a>
                  ) : (
                    <span className="mono">{sha7(target.merged.sha)}</span>
                  )}
                </Row>
              )}
              <motion.li
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36, duration: 0.14 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <CheckLights lights={lights} size={16} />
                <span className="mono text-[12px] text-ink-3">
                  {CHECKS.map((c) => c.id).join(" · ")}
                </span>
              </motion.li>
            </motion.ul>
          )}
        </AnimatePresence>
        {target && (
          <details className="group border-t border-line py-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
              <span className="transition-transform group-open:rotate-90">▸</span>
              Evidence JSON (the exact bytes hashed)
              <span className="ml-auto">
                <CopyButton value={evidenceOf(target.report)} label="Copy the evidence JSON">
                  Copy
                </CopyButton>
              </span>
            </summary>
            <pre className="mono mt-2 max-h-80 overflow-auto rounded-control bg-sunken p-3 text-[12px] leading-[18px] break-all whitespace-pre-wrap text-ink-2">
              {evidenceOf(target.report)}
            </pre>
          </details>
        )}
      </section>
    </div>
  );
}
