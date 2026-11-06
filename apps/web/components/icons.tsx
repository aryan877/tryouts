import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export type IconProps = SVGProps<SVGSVGElement>;
export type Icon = (props: IconProps) => React.ReactElement;

const stroke =
  (children: React.ReactNode): Icon =>
  ({ className, ...props }) => (
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

export const Check = stroke(<path d="M20 6 9 17l-5-5" />);
export const ArrowRight = stroke(<path d="M5 12h14M12 5l7 7-7 7" />);
export const ArrowUp = stroke(<path d="M12 19V5M5 12l7-7 7 7" />);
export const Plus = stroke(<path d="M12 5v14M5 12h14" />);
export const ChevronDown = stroke(<path d="m6 9 6 6 6-6" />);
export const Blocked = stroke(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.9 4.9 14.2 14.2" />
  </>,
);
export const Sun = stroke(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>,
);
export const Moon = stroke(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
export const Play = stroke(<path d="M7 4v16l13-8Z" />);
export const Commit = stroke(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h6M15 12h6" />
  </>,
);
export const SwitchIcon = stroke(
  <>
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <circle cx="16" cy="12" r="2.5" />
  </>,
);
export const Scale = stroke(
  <>
    <path d="M12 3v18M7 21h10M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
  </>,
);
export const Network = stroke(
  <>
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8" />
  </>,
);
export const Folders = stroke(
  <>
    <path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" />
    <path d="M2 8v11a2 2 0 0 0 2 2h14" />
  </>,
);
export const Terminal = stroke(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m6 9 3 3-3 3M12 15h5" />
  </>,
);
export const Gauge = stroke(
  <>
    <path d="m12 14 4-4" />
    <path d="M3.34 19a10 10 0 1 1 17.32 0" />
  </>,
);
export const SquareCheck = stroke(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>,
);
export const Lock = stroke(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
);
export const AtSign = stroke(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </>,
);
export const Trash = stroke(
  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />,
);
export const Chats = stroke(
  <>
    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z" />
    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
  </>,
);
