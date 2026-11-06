"use client";

import { DropdownMenu } from "radix-ui";
import { useState } from "react";
import { ChevronDown, Copy, Download, LinkIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

const item =
  "flex h-9 cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 text-[14px] outline-none data-[highlighted]:bg-surface-2";

export function ShareMenu({ path, card, digest }: { path: string; card: string; digest: string }) {
  const [done, setDone] = useState<string | null>(null);
  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(() => {
      setDone(label);
      setTimeout(() => setDone(null), 1600);
    });
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">
          {done ?? "Share"}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-panel bg-raised p-1.5 text-ink shadow-raised"
        >
          <DropdownMenu.Item
            className={item}
            onSelect={() => copy(`${location.origin}${path}`, "Link copied")}
          >
            <LinkIcon className="size-4 text-ink-3" />
            Copy link
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} asChild>
            <a href={card} download>
              <Download className="size-4 text-ink-3" />
              Download card <span className="ml-auto text-[12px] text-ink-3">1080×1350</span>
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => copy(digest, "Digest copied")}>
            <Copy className="size-4 text-ink-3" />
            Copy digest
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
