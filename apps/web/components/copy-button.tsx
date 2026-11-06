"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
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
      aria-label={label}
      onClick={() => navigator.clipboard.writeText(value).then(() => setCopied(true))}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md text-gray-900 transition-colors hover:bg-gray-alpha-200 hover:text-gray-1000",
        className,
      )}
    >
      {copied ? <Check className="text-green-700" /> : <Copy />}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

export function Snippet({ value, prompt = true }: { value: string; prompt?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-alpha-400 bg-background-100 py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 overflow-x-auto py-1 text-copy-13-mono whitespace-nowrap">
        {prompt && <span className="text-gray-900 select-none">$ </span>}
        {value}
      </code>
      <CopyButton value={value} label={`Copy: ${value}`} />
    </div>
  );
}
