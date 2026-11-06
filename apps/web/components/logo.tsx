import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-6 shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-gray-1000" />
      <path
        d="m9.5 16.5 4.5 4.5 8.5-9.5"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background-100"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-md" aria-label="Tryouts home">
      <LogoMark />
      <span className="text-[17px] leading-none font-semibold tracking-[-0.4px]">Tryouts</span>
    </Link>
  );
}
