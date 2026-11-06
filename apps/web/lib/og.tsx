import type { Candidate, TryoutRecord } from "@tryouts/kit/record";
import { appOf, lightsOf, ownerOf } from "./board";
import { diff, dollars, elapsed, stampDate, tokens } from "./format";

type Font = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal";
};

const FONTS = [
  { name: "Archivo Condensed", query: "Archivo:wdth,wght@62,850", weight: 800 },
  { name: "Archivo Narrow", query: "Archivo:wdth,wght@75,900", weight: 900 },
  { name: "Archivo", query: "Archivo:wght@600", weight: 600 },
  { name: "Archivo", query: "Archivo:wght@400", weight: 400 },
  { name: "JetBrains Mono", query: "JetBrains+Mono:wght@500", weight: 500 },
] as const;

async function load(query: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`)
    ).text();
    const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

let cached: Promise<Font[]> | undefined;

async function loadAll(): Promise<Font[]> {
  const fonts: Font[] = [];
  for (const font of FONTS) {
    const data = await load(font.query);
    if (data) fonts.push({ name: font.name, data, weight: font.weight, style: "normal" });
  }
  return fonts;
}

export function ogFonts(): Promise<Font[]> {
  cached ??= loadAll();
  return cached;
}

const SCREEN = "#060709";
const LINE = "#1e2127";
const INK = "#f5f6f7";
const INK2 = "#a9afba";
const INK3 = "#7a818d";
const BIBS = ["#5b8bff", "#ff6fae", "#34c8e6", "#f3f4f6"];
const FOIL = "linear-gradient(135deg, #f9e7a1 0%, #e8b931 38%, #b8860b 62%, #f3d77a 100%)";
const LIGHT = {
  pass: "#30d158",
  fail: "#ff453a",
  off: "#1a1d22",
  checking: "#ffb224",
  start: "#ff453a",
};

export function OgMark({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size / 5,
        background: SCREEN,
        border: `1px solid ${LINE}`,
        alignItems: "center",
        justifyContent: "center",
        gap: size / 14,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{ width: size / 7, height: size / 7, borderRadius: 99, background: "#30d158" }}
        />
      ))}
    </div>
  );
}

export function OgCard({
  record,
  candidate: c,
  scale = 1,
}: {
  record: TryoutRecord;
  candidate: Candidate;
  scale?: number;
}) {
  const s = (n: number) => n * scale;
  const hire = record.hire;
  const app = hire ? appOf(record, hire.approval.room) : null;
  return (
    <div
      style={{
        display: "flex",
        width: s(360),
        height: s(504),
        padding: s(6),
        borderRadius: s(16),
        backgroundImage: FOIL,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          borderRadius: s(10),
          background: SCREEN,
          padding: s(20),
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: s(12) }}>
          <div
            style={{
              display: "flex",
              width: s(28),
              height: s(32),
              borderRadius: s(6),
              background: BIBS[(c.bib - 1) % 4],
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo Condensed",
              fontSize: s(18),
              color: "#0c0d10",
            }}
          >
            {c.bib}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <div style={{ fontFamily: "Archivo", fontWeight: 600, fontSize: s(20) }}>{c.agent}</div>
            <div style={{ fontFamily: "Archivo", fontWeight: 400, fontSize: s(12), color: INK2 }}>
              {`${c.label} · ${c.model ?? "model not reported"}`}
            </div>
          </div>
          <div
            style={{
              fontFamily: "Archivo",
              fontWeight: 600,
              fontSize: s(10),
              letterSpacing: s(1),
              color: INK3,
            }}
          >
            {`TRYOUT #${record.issue}`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: s(28),
          }}
        >
          <div
            style={{
              fontFamily: "Archivo Condensed",
              fontSize: s(88),
              lineHeight: 0.9,
              letterSpacing: s(-1.5),
            }}
          >
            {dollars(c.cost)}
          </div>
          <div
            style={{
              fontFamily: "Archivo",
              fontWeight: 600,
              fontSize: s(11),
              letterSpacing: s(1),
              color: INK2,
              marginTop: s(10),
            }}
          >
            COST PER VERIFIED FIX · EST.
          </div>
        </div>
        {hire && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: s(16) }}>
            <div
              style={{
                display: "flex",
                padding: s(3),
                border: `${s(3)}px solid #f7da7e`,
                borderRadius: s(6),
                transform: "rotate(-3deg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: `${s(1)}px solid #f7da7e`,
                  borderRadius: s(3),
                  padding: `${s(6)}px ${s(14)}px`,
                  color: "#f7da7e",
                }}
              >
                <div
                  style={{ fontFamily: "Archivo Narrow", fontSize: s(22), letterSpacing: s(1.2) }}
                >
                  {`HIRED · ${record.role.toUpperCase()}`}
                </div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: s(8.5),
                    letterSpacing: s(1),
                    marginTop: s(3),
                  }}
                >
                  {`${stampDate(hire.approval.answeredAt ?? hire.at)} · ${ownerOf(record).toUpperCase()} · ${(app ?? "switch").toUpperCase()}`}
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: s(18) }}>
          <div
            style={{
              display: "flex",
              gap: s(12),
              padding: `${s(8)}px ${s(12)}px`,
              borderRadius: s(8),
              background: "#000",
            }}
          >
            {lightsOf(c).map((light, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: lights are positional
                key={i}
                style={{ width: s(20), height: s(20), borderRadius: 99, background: LIGHT[light] }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: "auto",
            paddingTop: s(14),
            borderTop: `1px solid ${LINE}`,
          }}
        >
          {[
            ["TIME", c.seconds !== null ? elapsed(c.seconds) : "—"],
            ["LINES", c.diff ? diff(c.diff) : "—"],
            [
              "TOKENS",
              tokens(c.tokens.input + c.tokens.output + c.tokens.cacheRead + c.tokens.cacheWrite),
            ],
            [
              "BUDGET",
              c.budget
                ? `${Math.round((c.budget.spent / c.budget.limit) * 100)}% of ${tokens(c.budget.limit)}`
                : "—",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "50%",
                marginBottom: s(10),
              }}
            >
              <div
                style={{
                  fontFamily: "Archivo",
                  fontWeight: 600,
                  fontSize: s(10),
                  letterSpacing: s(1),
                  color: INK3,
                }}
              >
                {label}
              </div>
              <div
                style={{ fontFamily: "Archivo", fontWeight: 600, fontSize: s(17), marginTop: s(3) }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: s(4),
          }}
        >
          <div
            style={{
              fontFamily: "Archivo",
              fontWeight: 600,
              fontSize: s(10),
              letterSpacing: s(1),
              color: INK3,
            }}
          >
            {`1 OF ${record.candidates.length} CANDIDATES`}
          </div>
          <OgMark size={s(18)} />
        </div>
      </div>
    </div>
  );
}

export const OG = { SCREEN, INK, INK2, INK3, LINE };
