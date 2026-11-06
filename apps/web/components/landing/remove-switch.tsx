"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Close } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface SwitchRow {
  step: string;
  with: React.ReactNode;
  without: string;
  proof?: string | undefined;
}

export function RemoveSwitchTable({ rows }: { rows: SwitchRow[] }) {
  const [on, setOn] = useState(true);
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="caps text-ink-3">Switch</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Switch"
          onClick={() => setOn((v) => !v)}
          className={cn(
            "relative h-7 w-[52px] rounded-full transition-colors duration-200",
            on ? "bg-ink" : "bg-line-strong",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-1 left-1 size-5 rounded-full bg-page transition-transform duration-200 ease-out",
              on && "translate-x-6",
            )}
          />
        </button>
        <span className="text-[14px] font-semibold">{on ? "On" : "Off"}</span>
      </div>
      <table className="panel mt-5 w-full border-separate border-spacing-0 overflow-hidden text-left">
        <caption className="sr-only">What each step needs from Switch</caption>
        <thead className="hidden md:table-header-group">
          <tr>
            {["Step", "With Switch", "Without Switch"].map((label) => (
              <th
                key={label}
                scope="col"
                className="caps border-b border-line-strong bg-surface-2 px-5 py-2.5 font-[650] text-ink-3"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const delay = { transitionDelay: `${i * 60}ms` };
            return (
              <tr
                key={row.step}
                className="block border-b border-line py-2 last:border-b-0 md:table-row md:py-0"
              >
                <th
                  scope="row"
                  className="block px-5 pt-2 align-top text-[15px] leading-[22px] font-[650] md:table-cell md:w-[24%] md:border-b md:border-line md:py-4 [tr:last-child>&]:border-b-0"
                >
                  {row.step}
                </th>
                <td
                  className={cn(
                    "block px-5 py-1.5 align-top text-[14px] leading-[21px] transition-colors duration-300 md:table-cell md:w-[42%] md:border-b md:border-line md:py-4 [tr:last-child>&]:border-b-0",
                    !on && "muted",
                  )}
                  style={delay}
                >
                  <span className="flex gap-2.5">
                    <Check
                      className={cn(
                        "mt-0.5 size-4 transition-colors duration-300",
                        on ? "text-go-ink" : "text-ink-4",
                      )}
                    />
                    <span className="text-ink">
                      {row.with}
                      {row.proof && (
                        <Link
                          href={row.proof}
                          className="ml-1.5 inline-flex items-center text-[13px] font-semibold whitespace-nowrap text-ink-3 hover:text-ink"
                        >
                          See it
                          <ArrowUpRight className="size-3" />
                        </Link>
                      )}
                    </span>
                  </span>
                </td>
                <td
                  className="block px-5 pt-1.5 pb-2 align-top text-[14px] leading-[21px] md:table-cell md:border-b md:border-line md:py-4 [tr:last-child>&]:border-b-0"
                  style={delay}
                >
                  <span className="flex gap-2.5">
                    <Close
                      className={cn(
                        "mt-0.5 size-4 transition-colors duration-300",
                        on ? "text-ink-4" : "text-stop",
                      )}
                    />
                    <span
                      className={cn(
                        "transition-colors duration-300",
                        on ? "text-ink-3" : "text-ink",
                      )}
                      style={delay}
                    >
                      {row.without}
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-4 text-[15px] leading-[22px] text-ink-2" aria-live="polite">
        {on
          ? "Every row is a Switch feature doing real work in the recorded run."
          : "Without Switch: no candidates, no budgets, no owner-only hire. Just three terminals and a guess."}
      </p>
    </div>
  );
}
