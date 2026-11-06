import Link from "next/link";
import { GitHub } from "@/components/icons";
import { GITHUB_URL } from "@/lib/site";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { VideoButton } from "./video-button";

const NAV = [
  { href: "/tryouts", label: "Live board" },
  { href: "/hires", label: "Hire records" },
  { href: "/verify", label: "Verify" },
  { href: "/#how", label: "How it works" },
];

export function SiteHeader({ sample }: { sample: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur-[8px] backdrop-saturate-[1.4]">
      <div className="container-page flex h-14 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-control px-2.5 py-1.5 text-[14px] font-medium text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <a
            href={GITHUB_URL}
            aria-label="Tryouts on GitHub"
            className="grid size-9 place-items-center rounded-control text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink"
          >
            <GitHub className="size-[18px]" />
          </a>
          <span className="ml-1 hidden sm:inline-flex">
            <VideoButton />
          </span>
          <details className="relative md:hidden">
            <summary className="grid h-9 cursor-pointer list-none place-items-center rounded-control px-2.5 text-[14px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <nav
              aria-label="Main"
              className="absolute top-11 right-0 flex w-48 flex-col rounded-panel bg-raised p-1.5 shadow-raised"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-control px-3 py-2 text-[15px] font-medium text-ink hover:bg-surface-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
      {sample && (
        <p className="border-t border-line bg-hold-tint py-1 text-center text-[12px] font-semibold text-hold-ink">
          Sample data for development. This is not a recorded run.
        </p>
      )}
    </header>
  );
}
