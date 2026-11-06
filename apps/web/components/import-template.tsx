"use client";

import { Popover } from "radix-ui";
import { Download } from "@/components/icons";
import { TEMPLATE_URLS } from "@/lib/site";
import { CopyButton } from "./copy-button";

export function ImportTemplate() {
  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex items-center gap-1.5 rounded-chip text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        <Download className="size-4" />
        Import the template
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 w-[min(92vw,420px)] rounded-panel bg-raised p-4 text-[14px] leading-5 text-ink shadow-raised data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <ol className="flex flex-col gap-3">
            <li>
              <p className="font-semibold">1. Download the three templates</p>
              {TEMPLATE_URLS.map((url) => (
                <div
                  key={url}
                  className="mt-1.5 flex items-center gap-1 rounded-control bg-sunken pl-2.5"
                >
                  <a
                    href={url}
                    download
                    className="mono min-w-0 flex-1 truncate text-[12px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    {url.split("/").pop()}
                  </a>
                  <CopyButton value={url} label={`Copy the URL of ${url.split("/").pop()}`} />
                </div>
              ))}
            </li>
            <li>
              <p className="font-semibold">2. In Switch Console</p>
              <p className="text-ink-2">
                Resources → Templates → Upload template → Load from file, once per file. Then use
                tryouts-team.
              </p>
            </li>
            <li>
              <p className="font-semibold">3. Then post a job in #hiring</p>
              <code className="mono mt-1.5 block rounded-control bg-sunken px-2.5 py-2 text-[12px] text-ink-2">
                @hiring we need a bug fixer. Try Claude Code, Codex and OpenCode on #12.
              </code>
            </li>
          </ol>
          <Popover.Arrow className="fill-raised" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
