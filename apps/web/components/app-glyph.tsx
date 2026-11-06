import type { App } from "@tryouts/kit/record";
import { DiscordMark, MattermostMark, SlackMark } from "@/components/icons";
import { APPS } from "@/lib/run";
import { cn } from "@/lib/utils";

const MARK = { slack: SlackMark, discord: DiscordMark, mattermost: MattermostMark } as const;

export function AppName({ app, className }: { app: App | null; className?: string }) {
  if (!app) return <span className={className}>Switch</span>;
  const Mark = MARK[app];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", className)}>
      <Mark className="size-3.5 text-gray-900" />
      {APPS[app]}
    </span>
  );
}
