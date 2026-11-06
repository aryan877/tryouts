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
        <span tabIndex={0} className={cn("rounded-[2px] outline-offset-1", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 text-[12px] leading-4">{label}</TooltipContent>
    </Tooltip>
  );
}
