import Link from "next/link";

export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center gap-[1.5px] rounded-[4px] bg-screen"
      style={{ width: size, height: size }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="size-[3px] rounded-full bg-[#30d158]" />
      ))}
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-chip" aria-label="Tryouts home">
      <LogoMark />
      <span className="text-[18px] leading-none font-[750] tracking-[-0.01em] wdth-85">
        Tryouts
      </span>
    </Link>
  );
}
