import Link from "next/link";
import { LogoMark } from "./logo";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="container-page py-24">
      <div className="screen mx-auto flex max-w-xl flex-col items-start gap-4 rounded-panel p-8">
        <LogoMark size={28} />
        <h1 className="h2 text-screen-ink">{title}</h1>
        <p className="text-[15px] leading-[22px] text-screen-ink-2">{body}</p>
        {action && (
          <Link
            href={action.href}
            className="inline-flex h-10 items-center rounded-control bg-screen-ink px-4 text-[14px] font-semibold text-screen"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
