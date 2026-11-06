import { Play } from "@/components/icons";
import { GitHubLogo } from "@/components/logos";
import { GITHUB_URL } from "@/lib/site";
import { Logo } from "./logo";
import { ThemeSwitcher } from "./theme-switcher";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#switch", label: "Switch" },
  { href: "/#setup", label: "Setup" },
];

const pill =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-button-14 transition-colors";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background-200/75 backdrop-blur-lg">
      <div className="container-page relative flex h-16 items-center gap-2 md:max-w-[1400px]">
        <Logo />
        <nav
          aria-label="Main"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
        >
          {LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-label-16 text-gray-900 transition-colors hover:text-gray-1000"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          <a
            href={GITHUB_URL}
            aria-label="Tryouts on GitHub"
            className={`${pill} bg-gray-alpha-200 text-gray-1000 hover:bg-gray-alpha-300 max-sm:px-2.5`}
          >
            <GitHubLogo />
            <span className="max-sm:hidden">GitHub</span>
          </a>
          <a
            href="/#video"
            className={`${pill} bg-gray-1000 text-background-200 hover:bg-gray-1000/85`}
          >
            <Play className="size-3.5" />
            Watch the video
          </a>
        </div>
      </div>
    </header>
  );
}
