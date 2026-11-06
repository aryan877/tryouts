"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DIGITS = "0123456789";

export function Rolling({
  text,
  from,
  className,
  stagger = "right",
}: {
  text: string;
  from?: string | undefined;
  className?: string | undefined;
  stagger?: "left" | "right";
}) {
  const [shown, setShown] = useState(text);
  const [instant, setInstant] = useState(false);
  useEffect(() => {
    if (from === undefined || from.length !== text.length) {
      setShown(text);
      return;
    }
    setInstant(true);
    setShown(from);
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setInstant(false);
        setShown(text);
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [text, from]);
  const chars = [...(shown.length === text.length ? shown : text)];
  return (
    <span className={cn("num inline-flex", className)}>
      <span className="sr-only">{text}</span>
      {chars.map((char, i) => {
        const digit = DIGITS.indexOf(char);
        const order = stagger === "right" ? chars.length - 1 - i : i;
        if (digit < 0) {
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: separators are positional
              key={`${i}-${char}`}
              aria-hidden
            >
              {char}
            </span>
          );
        }
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: digit columns are positional
            key={i}
            aria-hidden
            className="relative inline-block h-[1em] overflow-hidden leading-none"
          >
            <span className="invisible">0</span>
            <span
              className="absolute inset-x-0 top-0 flex flex-col"
              style={{
                transform: `translateY(${-digit}em)`,
                transition: instant
                  ? "none"
                  : `transform ${from !== undefined ? 420 : 360}ms var(--ease-out) ${order * (from !== undefined ? 60 : 30)}ms`,
              }}
            >
              {[...DIGITS].map((d) => (
                <span key={d} className="h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
