import type { App } from "@tryouts/kit/record";
import { DiscordMark, MattermostMark, SlackMark } from "@/components/icons";
import { cn } from "@/lib/utils";

const MARK = { slack: SlackMark, discord: DiscordMark, mattermost: MattermostMark } as const;
export const APP_LABEL: Record<App, string> = {
  slack: "Slack",
  discord: "Discord",
  mattermost: "Mattermost",
};

export function AppGlyph({
  app,
  className,
  label = true,
}: {
  app: App | null;
  className?: string;
  label?: boolean;
}) {
  if (!app) return null;
  const Mark = MARK[app];
  return (
    <>
      <Mark className={cn("size-3.5", className)} />
      {label && <span className="sr-only"> on {APP_LABEL[app]}</span>}
    </>
  );
}
