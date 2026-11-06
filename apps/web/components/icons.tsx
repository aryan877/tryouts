import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export type IconProps = SVGProps<SVGSVGElement>;

const stroke =
  (children: React.ReactNode) =>
  ({ className, ...props }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );

const fill =
  (d: string, viewBox = "0 0 24 24", rule?: "evenodd") =>
  ({ className, ...props }: IconProps) => (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
      {...props}
    >
      <path d={d} fillRule={rule} />
    </svg>
  );

export const Check = stroke(<path d="M20 6 9 17l-5-5" />);
export const Close = stroke(<path d="M18 6 6 18M6 6l12 12" />);
export const ArrowLeft = stroke(<path d="M19 12H5M12 19l-7-7 7-7" />);
export const ArrowRight = stroke(<path d="M5 12h14M12 5l7 7-7 7" />);
export const ArrowUpRight = stroke(<path d="M7 7h10v10M7 17 17 7" />);
export const ChevronRight = stroke(<path d="m9 18 6-6-6-6" />);
export const Copy = stroke(
  <>
    <rect x="8" y="8" width="13" height="13" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
);
export const Sun = stroke(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>,
);
export const Moon = stroke(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
export const Monitor = stroke(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </>,
);
export const Commit = stroke(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h6M15 12h6" />
  </>,
);
export const IssueIcon = stroke(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="1" />
  </>,
);
export const CheckCircle = stroke(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>,
);
export const Blocked = stroke(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </>,
);
export const Refresh = stroke(
  <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.4 6.4L3 16M8 16H3v5" />,
);
export const Play = stroke(<path d="M7 4v16l13-8Z" />);
export const SwitchIcon = stroke(
  <>
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <circle cx="16" cy="12" r="2.5" />
  </>,
);

export const GitHub = fill(
  "M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z",
  "0 0 16 16",
);
export const SlackMark = fill(
  "M8.8 2a1.6 1.6 0 0 1 1.6 1.6v6.6a1.6 1.6 0 1 1-3.2 0V3.6A1.6 1.6 0 0 1 8.8 2Zm11.6 6.8a1.6 1.6 0 0 1 0 3.2h-6.6a1.6 1.6 0 1 1 0-3.2ZM15.2 22a1.6 1.6 0 0 1-1.6-1.6v-6.6a1.6 1.6 0 1 1 3.2 0v6.6a1.6 1.6 0 0 1-1.6 1.6ZM3.6 15.2a1.6 1.6 0 0 1 0-3.2h6.6a1.6 1.6 0 1 1 0 3.2ZM3.6 7.2h1.6v1.6a1.6 1.6 0 1 1-1.6-1.6Zm13.2-3.6v1.6h1.6a1.6 1.6 0 1 0-1.6-1.6Zm3.6 13.2h-1.6v1.6a1.6 1.6 0 1 0 1.6-1.6ZM7.2 20.4v-1.6H5.6a1.6 1.6 0 1 0 1.6 1.6Z",
);
export const DiscordMark = fill(
  "M19.6 5.4A16.8 16.8 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a16.8 16.8 0 0 0-4.2 1.4C1.8 9.3 1.1 13.1 1.4 16.9a17 17 0 0 0 5.2 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.8l.4-.3a12 12 0 0 0 11.2 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a17 17 0 0 0 5.2-2.6c.4-4.4-.6-8.2-2.9-11.5ZM8.5 14.6c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Zm7 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Z",
);
export const MattermostMark = fill(
  "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm2.6 4.2-.4 3.1a4.3 4.3 0 1 1-4.4 0l-.4-3.1a6.8 6.8 0 1 0 5.2 0Zm-1.3-.7-1.8 5.6a1 1 0 0 0 2 .3Z",
  undefined,
  "evenodd",
);
