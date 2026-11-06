import type { TryoutRecord } from "@tryouts/kit/record";
import { Code } from "@/components/geist";
import { ChevronRight } from "@/components/icons";
import { clock, ms } from "@/lib/format";

function RichText({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: parts are positional
      <Code key={i}>{part.slice(1, -1)}</Code>
    ) : (
      part
    ),
  );
}

export function Messages({ record }: { record: TryoutRecord }) {
  const feed = [...record.feed].sort((a, b) => ms(a.at) - ms(b.at));
  return (
    <details className="card group">
      <summary className="flex h-12 cursor-pointer list-none items-center gap-2 rounded-lg px-4 text-label-14 font-medium select-none hover:bg-gray-alpha-100 sm:px-5 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="text-gray-900 transition-transform group-open:rotate-90" />
        <span className="group-open:hidden">Show all messages</span>
        <span className="hidden group-open:inline">Hide messages</span>
        <span className="font-normal text-gray-900">{feed.length}</span>
        <span className="ml-auto font-normal text-gray-900 max-sm:hidden">
          Read from Switch, as posted
        </span>
      </summary>
      <ol className="border-t border-gray-alpha-400">
        {feed.map((item, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: the feed is append-only and ordered
            key={i}
            className="grid gap-x-4 gap-y-0.5 border-b border-gray-alpha-400 px-4 py-2.5 last:border-0 sm:grid-cols-[72px_168px_minmax(0,1fr)] sm:px-5"
          >
            <time dateTime={item.at} className="text-label-13-mono leading-5 text-gray-900">
              {clock(item.at)}
            </time>
            <span className="flex min-w-0 gap-2 sm:flex-col sm:gap-0">
              <span className="truncate text-label-14 font-medium">{item.actor}</span>
              <span className="truncate text-label-13 leading-5 text-gray-900">#{item.room}</span>
            </span>
            <p className="min-w-0 text-copy-14 break-words text-gray-1000">
              <RichText text={item.text} />
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}
