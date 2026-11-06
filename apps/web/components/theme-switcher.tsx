"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "@/components/icons";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "system", label: "System", Icon: Monitor },
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <fieldset className="flex h-8 w-fit rounded-full p-0 shadow-border">
      <legend className="sr-only">Theme</legend>
      {THEMES.map(({ id, label, Icon }) => {
        const active = mounted && theme === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(id)}
            className={cn(
              "grid size-8 place-items-center rounded-full text-gray-900 transition-colors hover:text-gray-1000",
              active && "bg-background-100 text-gray-1000 shadow-[0_0_0_1px_var(--ds-gray-400)]",
            )}
          >
            <Icon />
          </button>
        );
      })}
    </fieldset>
  );
}
