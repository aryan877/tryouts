import { ArrowUpRight } from "@/components/icons";
import type { Tone } from "@/lib/run";
import { cn } from "@/lib/utils";

const BADGE: Record<Tone, string> = {
  gray: "bg-badge-gray text-gray-1000",
  blue: "bg-badge-blue text-blue-900",
  green: "bg-badge-green text-green-900",
  red: "bg-badge-red text-red-900",
  amber: "bg-badge-amber text-amber-900",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] leading-6 font-medium whitespace-nowrap tabular-nums",
        BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const DOT: Record<Tone, string> = {
  gray: "bg-gray-500",
  blue: "bg-blue-700",
  green: "bg-green-700",
  red: "bg-red-800",
  amber: "bg-amber-700",
};

export function StatusDot({
  tone,
  label,
  pulse = false,
  className,
}: {
  tone: Tone;
  label?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}) {
  const dot = (
    <span
      aria-hidden={label ? true : undefined}
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        DOT[tone],
        pulse && "animate-status",
        className,
      )}
    />
  );
  if (!label) return dot;
  return (
    <span className="inline-flex items-center gap-2 text-label-14 text-gray-1000">
      {dot}
      {label}
    </span>
  );
}

const NOTE = {
  default: "border-gray-400 text-gray-900",
  success: "border-blue-400 text-blue-900",
  warning: "border-amber-400 text-amber-900",
} as const;

export function Note({
  type = "default",
  className,
  children,
}: {
  type?: keyof typeof NOTE;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 text-copy-14 break-words",
        NOTE[type],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[4px] border border-gray-alpha-400 bg-gray-alpha-100 px-1 py-px text-[0.9em]">
      {children}
    </code>
  );
}

export function Section({
  id,
  title,
  description,
  action,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={cn("scroll-mt-20", className)} id={id}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id={`${id}-title`} className="text-heading-20">
            {title}
          </h2>
          {description && <p className="mt-1 text-copy-14 text-gray-900">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ExternalLink({
  href,
  icon,
  children,
}: {
  href: string | null;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const body = (
    <>
      {icon}
      {children}
    </>
  );
  if (!href) return <span className="inline-flex items-center gap-1.5">{body}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-1.5 hover:underline"
    >
      {body}
      <ArrowUpRight className="size-3.5 text-gray-900 group-hover:text-gray-1000" />
    </a>
  );
}
