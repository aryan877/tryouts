import Link from "next/link";
import { GITHUB_URL, SWITCH_URL } from "@/lib/site";
import { LogoMark } from "./logo";

export function SiteFooter({ records }: { records: number[] }) {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-4 py-8 text-[13px] text-ink-3 md:flex-row md:items-center">
        <span className="flex items-center gap-2 text-ink-2">
          <LogoMark size={16} />
          Tryouts · built on Switch
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 md:ml-auto">
          <a href={GITHUB_URL} className="hover:text-ink">
            GitHub
          </a>
          <a href={SWITCH_URL} className="hover:text-ink">
            Switch
          </a>
          <Link href="/verify" className="hover:text-ink">
            Verify
          </Link>
          {records.map((issue) => (
            <a key={issue} href={`/records/${issue}.json`} className="hover:text-ink">
              Raw record #{issue}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
