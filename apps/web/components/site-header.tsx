import Link from "next/link";
import { GitHub } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/lib/site";
import { Logo } from "./logo";
import { VideoButton } from "./video-button";

const NAV = [
  { href: "/tryouts", label: "Tryouts" },
  { href: "/hires", label: "Hires" },
  { href: "/verify", label: "Verify" },
  { href: "/#how", label: "How it works" },
];

export function SiteHeader({ run, sample }: { run: string | null; sample: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-alpha-400 bg-background-100">
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-label-14 text-gray-900 transition-colors hover:bg-gray-alpha-100 hover:text-gray-1000"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <VideoButton />
          <Button asChild variant="secondary" size="sm" className="max-sm:size-8 max-sm:px-0">
            <a href={GITHUB_URL} aria-label="Tryouts on GitHub">
              <GitHub />
              <span className="max-sm:sr-only">GitHub</span>
            </a>
          </Button>
          {run && (
            <Button asChild size="sm">
              <Link href={run}>View the run</Link>
            </Button>
          )}
        </div>
      </div>
      {sample && (
        <p className="border-t border-amber-400 bg-amber-100 py-1.5 text-center text-label-13 text-amber-900">
          Sample data for development. This is not a recorded run.
        </p>
      )}
    </header>
  );
}
