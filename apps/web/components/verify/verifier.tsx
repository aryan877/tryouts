"use client";

import type { App } from "@tryouts/kit/record";
import type { ProofReport } from "@tryouts/referee";
import { useCallback, useEffect, useState } from "react";
import { AppName } from "@/components/app-glyph";
import { CopyButton } from "@/components/copy-button";
import { ExternalLink, StatusDot } from "@/components/geist";
import { Check, ChevronRight, Close, Refresh } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { digestOf, evidenceOf } from "@/lib/digest";
import { sha7 } from "@/lib/format";
import { CHECKS } from "@/lib/run";
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

function Row({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 border-b border-gray-alpha-400 px-5 py-3.5 last:border-0">
      <span
        className={cn(
          "mt-px grid size-5 shrink-0 place-items-center rounded-full text-white",
          ok ? "bg-green-700" : "bg-red-800",
        )}
      >
        {ok ? <Check className="size-3" /> : <Close className="size-3" />}
      </span>
      <span className="min-w-0 text-copy-14 text-gray-1000">{children}</span>
    </li>
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
        setError("No recorded referee report has that digest.");
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

  return (
    <div className="flex flex-col gap-6">
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
          className="h-10 min-w-0 flex-1 rounded-md bg-background-100 px-3 font-mono text-[13px] text-gray-1000 shadow-[0_0_0_1px_var(--ds-gray-alpha-400)] transition-shadow outline-none hover:shadow-[0_0_0_1px_var(--ds-gray-alpha-500)] focus-visible:shadow-[0_0_0_1px_var(--ds-gray-alpha-500),0_0_0_4px_var(--ds-gray-alpha-200)] focus-visible:outline-none"
        />
        <Button type="submit">
          <Refresh />
          Recompute
        </Button>
      </form>

      {evidence.length > 1 && (
        <div className="-mt-3 flex flex-wrap items-center gap-2">
          <span className="text-label-13 text-gray-900">Recorded reports:</span>
          {evidence.map((e) => (
            <button
              key={e.report.digest}
              type="button"
              aria-pressed={target?.report.digest === e.report.digest}
              onClick={() => {
                setInput(e.report.digest);
                run(e.report.digest);
              }}
              className={cn(
                "h-7 rounded-full px-3 text-label-13 transition-colors",
                target?.report.digest === e.report.digest
                  ? "bg-gray-1000 text-background-100"
                  : "text-gray-900 shadow-[0_0_0_1px_var(--ds-gray-alpha-400)] hover:bg-gray-alpha-100 hover:text-gray-1000",
              )}
            >
              #{e.issue} {e.agent}
            </button>
          ))}
        </div>
      )}

      <section aria-live="polite" className="card">
        <h2 className="border-b border-gray-alpha-400 px-5 py-3 text-heading-14">Result</h2>
        {error && (
          <ul>
            <Row ok={false}>{error}</Row>
          </ul>
        )}
        {!error && !result && (
          <p className="px-5 py-4 text-copy-14 text-gray-900">
            Press Recompute to hash the evidence in your browser.
          </p>
        )}
        {target && result && (
          <ul key={result.digest + target.agent}>
            <Row ok={matches}>
              {matches ? (
                <>
                  <strong className="font-medium">The digest matches.</strong>{" "}
                  <span className="text-gray-900">
                    Your browser hashed the evidence below in{" "}
                    {result.ms < 1 ? "under 1 ms" : `${result.ms.toFixed(0)} ms`} and got the same
                    value the referee posted.
                  </span>
                </>
              ) : (
                <>
                  <strong className="font-medium">The digest doesn't match.</strong> This report was
                  changed after the referee ran.
                </>
              )}
            </Row>
            <Row ok={matches}>
              <span className="inline-flex flex-wrap items-center gap-x-1.5">
                Same digest as the referee's message in #{target.room} on
                <AppName app={target.app} />
              </span>
            </Row>
            {target.merged && (
              <Row ok>
                <span className="inline-flex flex-wrap items-center gap-x-1.5">
                  Commit{" "}
                  <span className="font-mono text-[13px]">{sha7(target.report.head.sha)}</span>{" "}
                  merged into main as
                  <ExternalLink href={target.merged.url}>
                    <span className="font-mono text-[13px]">{sha7(target.merged.sha)}</span>
                  </ExternalLink>
                </span>
              </Row>
            )}
          </ul>
        )}
        {target && (
          <>
            <ul className="grid gap-x-6 gap-y-2.5 border-t border-gray-alpha-400 px-5 py-4 sm:grid-cols-2">
              {CHECKS.map(({ id, label }) => {
                const passed = target.report.checks.find((c) => c.id === id)?.passed ?? null;
                return (
                  <li key={id} className="flex items-center gap-2.5 text-label-14">
                    <StatusDot tone={passed === null ? "gray" : passed ? "green" : "red"} />
                    <span className={passed === false ? "text-red-900" : "text-gray-1000"}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <details className="group border-t border-gray-alpha-400">
              <summary className="flex h-12 cursor-pointer list-none items-center gap-2 px-5 text-label-14 font-medium select-none hover:bg-gray-alpha-100 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="text-gray-900 transition-transform group-open:rotate-90" />
                Evidence: the exact bytes that were hashed
              </summary>
              <div className="flex items-start gap-2 px-5 pb-5">
                <pre className="min-w-0 flex-1 overflow-auto rounded-md border border-gray-alpha-400 bg-background-200 p-3 text-copy-13-mono break-all whitespace-pre-wrap text-gray-1000">
                  {evidenceOf(target.report)}
                </pre>
                <CopyButton value={evidenceOf(target.report)} label="Copy the evidence JSON" />
              </div>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
