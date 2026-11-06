import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-label-13-mono tracking-[0.12em] text-gray-900 uppercase", className)}>
      {children}
    </p>
  );
}

export function SectionTitle({
  id,
  eyebrow,
  title,
  center = false,
  className,
  children,
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  center?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("reveal max-w-[680px]", center && "mx-auto text-center", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-5 text-display-44 text-balance md:text-display-56">
        {title}
      </h2>
      {children && <p className="mt-5 text-copy-18 text-pretty text-gray-900">{children}</p>}
    </div>
  );
}

export function Band({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative", className)}>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-[1100px] bg-gradient-to-r from-transparent via-gray-alpha-400 to-transparent"
      />
      <div className="container-page py-24 md:py-28">{children}</div>
    </section>
  );
}

export const card = "rounded-2xl border border-gray-alpha-300 bg-background-100";
