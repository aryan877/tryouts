import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5BF08A" />
          <stop offset="1" stopColor="#12B886" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#14161c" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.1"
      />
      <rect x="6" y="15" width="5.6" height="11" rx="2" fill="#6b7280" />
      <rect x="20.4" y="18" width="5.6" height="8" rx="2" fill="#6b7280" />
      <rect x="13.2" y="11" width="5.6" height="15" rx="2" fill={`url(#${id})`} />
      <path
        d="m12.6 6.6 2.5 2.5 4.6-4.9"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label="Tryouts home">
      <LogoMark />
      <span className="font-serif text-[25px] leading-none tracking-[-0.3px]">Tryouts</span>
    </Link>
  );
}
