import { ImageResponse } from "next/og";
import { dollars } from "@/lib/format";
import { OG, OgMark, ogFonts } from "@/lib/og";
import { getHire, listRecords } from "@/lib/records";
import { appName, ownerOf, standings, vendorOf } from "@/lib/run";

export const alt = "A Tryouts hire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await listRecords()).flatMap((record) =>
    record.hire ? [{ agent: record.hire.agent }] : [],
  );
}

export default async function Image({ params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  const record = await getHire(agent);
  const standing = record ? standings(record).find((s) => s.candidate.agent === agent) : null;
  const hire = record?.hire;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: OG.background,
        padding: 64,
        fontFamily: "Geist",
        color: OG.ink,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 600 }}
      >
        <OgMark size={40} />
        Tryouts
      </div>
      {record && hire && standing ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            padding: 48,
            borderRadius: 16,
            border: `2px solid ${OG.border}`,
            background: OG.card,
            gap: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 64, fontWeight: 600, letterSpacing: -3 }}>
            {`${agent} hired as @${record.role}`}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 28,
              color: OG.muted,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {standing.checks.map((check, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: checks are positional
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 99,
                    background: check ? OG.green : OG.red,
                  }}
                />
              ))}
            </div>
            {`${standing.passed} of 5 checks · ${vendorOf(standing.candidate)} · est. ${dollars(standing.candidate.cost)}`}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: OG.muted }}>
            {`Picked from ${record.candidates.length} tools on tryout #${record.issue}. Approved by ${ownerOf(record)} in ${appName(record, hire.approval.room)}.`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", marginTop: "auto", fontSize: 56, fontWeight: 600 }}>
          Don't pick your AI coding tool on vibes. Hold tryouts.
        </div>
      )}
    </div>,
    { ...size, fonts: await ogFonts() },
  );
}
