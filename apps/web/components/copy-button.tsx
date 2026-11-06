"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label,
  children,
  className,
}: {
  value: string;
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label={children ? undefined : label}
      onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control px-2 text-[13px] font-semibold text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {copied ? <Check className="size-4 text-go-ink" /> : <Copy className="size-4" />}
      {children}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
