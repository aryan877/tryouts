import { AGENTS, parseCandidate } from "@tryouts/kit";
import type { FeedItem } from "@tryouts/kit/record";
import { SwitchGlyph, Whistle } from "@/components/icons";
import { cn } from "@/lib/utils";
import { bibColor } from "./bib";

export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
          <code
            // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional
            key={i}
            className="mono rounded-[3px] bg-sunken px-1 py-px text-[0.9em]"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SourceMark({
  item,
  bibs,
  className,
}: {
  item: FeedItem;
  bibs?: Map<string, number>;
  className?: string;
}) {
  const box = cn("grid size-5 shrink-0 place-items-center", className);
  if (item.kind === "referee") return <Whistle className={cn(box, "p-0.5")} />;
  if (item.kind === "switch") return <SwitchGlyph className={cn(box, "p-0.5")} />;
  if (item.kind === "person") {
    return (
      <span
        aria-hidden
        className={cn(box, "rounded-full bg-ink text-[10px] leading-none font-bold text-on-ink")}
      >
        {item.actor.slice(0, 1)}
      </span>
    );
  }
  const bib = bibs?.get(item.actor) ?? (parseCandidate(item.actor) ? 0 : null);
  if (item.actor === AGENTS.hiring.name || bib === null) {
    return (
      <span aria-hidden className={box}>
        <span className="size-2 rotate-45 rounded-[1px] bg-ink" />
      </span>
    );
  }
  return (
    <span aria-hidden className={box}>
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: bib ? bibColor(bib) : "var(--ink-3)" }}
      />
    </span>
  );
}
