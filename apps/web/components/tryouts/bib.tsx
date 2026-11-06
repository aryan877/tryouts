import { cn } from "@/lib/utils";

const PINNIE =
  "M6 0h16a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6Zm-1 3.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm18 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z";

export function bibColor(n: number) {
  return `var(--bib-${Math.min(4, Math.max(1, n))})`;
}

export function Bib({
  n,
  size = 32,
  className,
}: {
  n: number;
  size?: 20 | 24 | 32 | 48;
  className?: string;
}) {
  const slot = Math.min(4, Math.max(1, n));
  return (
    <span
      role="img"
      aria-label={`Bib ${n}`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: (size * 28) / 32, height: size }}
    >
      <svg viewBox="0 0 28 32" aria-hidden className="absolute inset-0 size-full overflow-visible">
        <path
          d={PINNIE}
          fillRule="evenodd"
          fill={bibColor(slot)}
          stroke={slot === 4 ? "#0c0d10" : "none"}
          strokeWidth={slot === 4 ? 1.5 : 0}
        />
      </svg>
      <span
        aria-hidden
        className="num relative wdth-62 leading-none font-[800]"
        style={{
          fontSize: size * 0.56,
          marginTop: size * 0.14,
          color: slot === 1 ? "var(--bib-1-ink)" : "#0c0d10",
        }}
      >
        {n}
      </span>
    </span>
  );
}
