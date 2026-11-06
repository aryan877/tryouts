"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "@/components/icons";

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Change theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-lg text-gray-900 transition-colors hover:bg-gray-alpha-200 hover:text-gray-1000"
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </button>
  );
}
