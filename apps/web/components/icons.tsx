import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = (props: IconProps) => React.JSX.Element;

function Svg({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

const icon =
  (d: string, evenOdd = false): IconComponent =>
  (props) => (
    <Svg {...props}>
      <path d={d} fillRule={evenOdd ? "evenodd" : undefined} />
    </Svg>
  );

export const Check = icon("M3.59 13.01 9.73 19.15 20.59 8.29 18.46 6.16 9.72 14.9 5.71 10.89Z");
export const Close = icon(
  "M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z",
);
export const ArrowLeft = icon("M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20Z");
export const ArrowRight = icon("M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4Z");
export const ArrowUpRight = icon("M7 5h12v12h-2.5V9.27l-9.6 9.6-1.77-1.77 9.6-9.6H7Z");
export const Play = icon(
  "M7 4.2v15.6a1 1 0 0 0 1.52.85l12.5-7.8a1 1 0 0 0 0-1.7L8.52 3.35A1 1 0 0 0 7 4.2Z",
);
export const Refresh = icon(
  "M12 4a8 8 0 0 1 7.2 4.5V5h2.3v7.5H14v-2.3h3.6A5.7 5.7 0 1 0 17.7 13h2.32A8 8 0 1 1 12 4Z",
);
export const Copy = icon(
  "M8 2.5h10.5a2 2 0 0 1 2 2V17h-2V4.5H8ZM5 6.5h10a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z",
);
export const Download = icon(
  "M10.75 3h2.5v9.2l3.37-3.37 1.77 1.77L12 17l-6.4-6.4 1.78-1.77 3.37 3.37ZM4 19h16v2.5H4Z",
);
export const LinkIcon = icon(
  "M10.6 13.4a1 1 0 0 1 0-1.4l4-4a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0ZM8.5 20a4.5 4.5 0 0 1-3.2-7.7l2.5-2.5 1.4 1.4-2.5 2.5a2.5 2.5 0 0 0 3.6 3.6l2.5-2.5 1.4 1.4-2.5 2.5A4.5 4.5 0 0 1 8.5 20Zm7.7-7.8-1.4-1.4 2.5-2.5a2.5 2.5 0 0 0-3.6-3.6l-2.5 2.5-1.4-1.4 2.5-2.5a4.5 4.5 0 0 1 6.4 6.4Z",
);
export const ChevronDown = icon("M6.4 8.6 12 14.2l5.6-5.6L19 10l-7 7-7-7Z");
export const Sun: IconComponent = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="4.75" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      d="M12 2.5v1.5M12 20v1.5M4.4 4.4l1.05 1.05M18.55 18.55l1.05 1.05M2.5 12H4M20 12h1.5M4.4 19.6l1.05-1.05M18.55 5.45l1.05-1.05"
    />
  </Svg>
);
export const Moon = icon("M20.5 14.6A8.75 8.75 0 0 1 9.4 3.5a8.75 8.75 0 1 0 11.1 11.1Z");
export const Lock = icon(
  "M12 1.5a5.5 5.5 0 0 1 5.5 5.5v2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h.5V7A5.5 5.5 0 0 1 12 1.5Zm0 2.25A3.25 3.25 0 0 0 8.75 7v2h6.5V7A3.25 3.25 0 0 0 12 3.75ZM12 13a1.75 1.75 0 0 0-1 3.19V18h2v-1.81A1.75 1.75 0 0 0 12 13Z",
  true,
);
export const Laptop = icon(
  "M5 3.5h14a2 2 0 0 1 2 2V15H3V5.5a2 2 0 0 1 2-2ZM1 16.5h22v.5a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 1 17Z",
);
export const Commit = icon(
  "M12 7a5 5 0 0 1 4.9 4H23v2h-6.1a5 5 0 0 1-9.8 0H1v-2h6.1A5 5 0 0 1 12 7Zm0 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
  true,
);
export const Crown = icon("M3 7.5 7.6 11 12 4l4.4 7L21 7.5 19.3 18H4.7ZM4.7 19.5h14.6V21H4.7Z");
export const Door = icon(
  "M5 2.5h11a1.5 1.5 0 0 1 1.5 1.5v16H20v2H3v-2h1.5V4A1.5 1.5 0 0 1 5 2.5Zm8.25 8.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z",
  true,
);
export const Whistle = icon(
  "M9.5 7H21v4.5l-5.13 1.55A6.5 6.5 0 1 1 9.5 7Zm0 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM12 3h2v3h-2Z",
  true,
);
export const SwitchGlyph = icon(
  "M7 5.5h10a6.5 6.5 0 1 1 0 13H7a6.5 6.5 0 1 1 0-13Zm10 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
  true,
);

export const GitHub = ({ className, ...props }: IconProps) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className={cn("size-5 shrink-0", className)}
    {...props}
  >
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);

export const SlackMark = icon(
  "M8.8 2a1.6 1.6 0 0 1 1.6 1.6v6.6a1.6 1.6 0 1 1-3.2 0V3.6A1.6 1.6 0 0 1 8.8 2Zm11.6 6.8a1.6 1.6 0 0 1 0 3.2h-6.6a1.6 1.6 0 1 1 0-3.2ZM15.2 22a1.6 1.6 0 0 1-1.6-1.6v-6.6a1.6 1.6 0 1 1 3.2 0v6.6a1.6 1.6 0 0 1-1.6 1.6ZM3.6 15.2a1.6 1.6 0 0 1 0-3.2h6.6a1.6 1.6 0 1 1 0 3.2ZM3.6 7.2h1.6v1.6a1.6 1.6 0 1 1-1.6-1.6Zm13.2-3.6v1.6h1.6a1.6 1.6 0 1 0-1.6-1.6Zm3.6 13.2h-1.6v1.6a1.6 1.6 0 1 0 1.6-1.6ZM7.2 20.4v-1.6H5.6a1.6 1.6 0 1 0 1.6 1.6Z",
);
export const DiscordMark = icon(
  "M19.6 5.4A16.8 16.8 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a16.8 16.8 0 0 0-4.2 1.4C1.8 9.3 1.1 13.1 1.4 16.9a17 17 0 0 0 5.2 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.8l.4-.3a12 12 0 0 0 11.2 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a17 17 0 0 0 5.2-2.6c.4-4.4-.6-8.2-2.9-11.5ZM8.5 14.6c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Zm7 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Z",
);
export const MattermostMark = icon(
  "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm2.6 4.2-.4 3.1a4.3 4.3 0 1 1-4.4 0l-.4-3.1a6.8 6.8 0 1 0 5.2 0Zm-1.3-.7-1.8 5.6a1 1 0 0 0 2 .3Z",
  true,
);
