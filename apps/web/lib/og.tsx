type Font = { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" };

async function load(weight: 400 | 600): Promise<Font | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}&display=swap`)
    ).text();
    const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    if (!url) return null;
    return { name: "Geist", data: await (await fetch(url)).arrayBuffer(), weight, style: "normal" };
  } catch {
    return null;
  }
}

let cached: Promise<Font[]> | undefined;

export function ogFonts(): Promise<Font[]> {
  cached ??= Promise.all([load(400), load(600)]).then((fonts) =>
    fonts.filter((font): font is Font => font !== null),
  );
  return cached;
}

export const OG = {
  background: "#fafafa",
  card: "#ffffff",
  border: "#ebebeb",
  ink: "#171717",
  muted: "#4d4d4d",
  green: "#28a948",
  red: "#e70022",
};

export function OgMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={OG.ink} />
      <path
        d="m9.5 16.5 4.5 4.5 8.5-9.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
