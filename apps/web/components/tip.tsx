"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Tip({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: the tooltip must be reachable by keyboard */}
        <span tabIndex={0} className={cn("inline-flex rounded-[2px]", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 rounded-md px-2.5 py-1.5 text-[13px] leading-[18px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
