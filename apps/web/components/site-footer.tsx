import Link from "next/link";
import { GITHUB_URL, SWITCH_URL } from "@/lib/site";
import { LogoMark } from "./logo";
import { ThemeSwitcher } from "./theme-switcher";

const link = "text-gray-900 transition-colors hover:text-gray-1000";

export function SiteFooter({ records }: { records: number[] }) {
  return (
    <footer className="border-t border-gray-alpha-400 bg-background-100">
      <div className="container-page flex flex-col gap-6 py-8 text-label-14 md:flex-row md:items-center">
        <span className="flex items-center gap-2 text-gray-1000">
          <LogoMark className="size-5" />
          Tryouts
          <span className="text-gray-900">· built on Switch</span>
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 md:ml-auto">
          <Link href="/tryouts" className={link}>
            Tryouts
          </Link>
          <Link href="/verify" className={link}>
            Verify
          </Link>
          <a href={GITHUB_URL} className={link}>
            GitHub
          </a>
          <a href={SWITCH_URL} className={link}>
            Switch
          </a>
          {records.map((issue) => (
            <a key={issue} href={`/records/${issue}.json`} className={link}>
              Raw record #{issue}
            </a>
          ))}
        </nav>
        <ThemeSwitcher />
      </div>
    </footer>
  );
}
