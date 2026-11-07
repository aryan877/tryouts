import { SwitchLogo } from "@/components/logos";
import { GITHUB_URL, SWITCH_URL } from "@/lib/site";
import { LogoMark } from "./logo";

const link = "text-gray-900 transition-colors hover:text-gray-1000";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-alpha-400">
      <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-4 py-10 text-label-14">
        <span className="flex items-center gap-2 text-gray-1000">
          <LogoMark className="size-5" />
          Tryouts
          <span className="text-gray-900">·</span>
          <a href={SWITCH_URL} className={`${link} inline-flex items-center gap-1.5`}>
            <SwitchLogo className="size-4" />
            built on Switch
          </a>
        </span>
        <nav aria-label="Footer" className="ml-auto flex gap-6">
          <a href={GITHUB_URL} className={link}>
            GitHub
          </a>
          <a href={SWITCH_URL} className={link}>
            Switch
          </a>
        </nav>
      </div>
    </footer>
  );
}
