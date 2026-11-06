import type { App } from "@tryouts/kit/record";
import { stampDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { APP_LABEL } from "./app-glyph";

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -7 4.6'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>",
)}")`;

const SIZE = {
  lane: { box: "h-[68px] w-[272px]", word: "text-[28px]", meta: "text-[10px]", pad: "p-[3px]" },
  card: { box: "h-[56px] w-[220px]", word: "text-[22px]", meta: "text-[8.5px]", pad: "p-[3px]" },
  hero: { box: "h-[46px] w-[156px]", word: "text-[14px]", meta: "text-[6.5px]", pad: "p-[2px]" },
} as const;

export function HiredStamp({
  role,
  date,
  approver,
  app,
  size = "lane",
  className,
}: {
  role: string;
  date: string;
  approver: string;
  app: App | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];
  const where = app ? APP_LABEL[app] : "Switch";
  return (
    <div
      role="img"
      aria-label={`Hired as ${role} on ${stampDate(date)}, approved by ${approver} in ${where}`}
      className={cn("pointer-events-none select-none text-hire-ink", s.box, className)}
      style={{ maskImage: GRAIN, WebkitMaskImage: GRAIN, maskSize: "160px 160px" }}
    >
      <div className={cn("size-full rounded-[6px] border-[3px] border-current", s.pad)}>
        <div className="flex size-full flex-col items-center justify-center rounded-[3px] border border-current">
          <span
            className={cn(
              "leading-none font-black tracking-[0.06em] whitespace-nowrap uppercase wdth-75",
              s.word,
            )}
          >
            Hired · {role}
          </span>
          <span
            className={cn(
              "mono mt-1 leading-none tracking-[0.12em] whitespace-nowrap uppercase",
              s.meta,
            )}
          >
            {stampDate(date)} · {approver} · {where}
          </span>
        </div>
      </div>
    </div>
  );
}
