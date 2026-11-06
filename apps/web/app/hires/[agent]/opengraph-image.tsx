import { ImageResponse } from "next/og";
import { appOf, ownerOf } from "@/lib/board";
import { dollars } from "@/lib/format";
import { OG, OgCard, OgMark, ogFonts } from "@/lib/og";
import { getHire, listRecords } from "@/lib/records";

export const alt = "A Tryouts hire record";
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
  const c = record?.candidates.find((x) => x.agent === agent);
  const hire = record?.hire;
  const fonts = await ogFonts();
  const app = record && hire ? appOf(record, hire.approval.room) : null;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: OG.SCREEN,
        padding: 56,
        alignItems: "center",
        gap: 56,
        color: OG.INK,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 200, height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <OgMark size={32} />
          <div style={{ fontFamily: "Archivo", fontWeight: 600, fontSize: 30 }}>Tryouts</div>
        </div>
        <div
          style={{
            fontFamily: "Archivo",
            fontWeight: 400,
            fontSize: 18,
            color: OG.INK2,
            marginTop: "auto",
          }}
        >
          Don't pick your AI agent on vibes. Hold tryouts.
        </div>
      </div>
      {record && c ? <OgCard record={record} candidate={c} scale={1.02} /> : null}
      <div style={{ display: "flex", flexDirection: "column", width: 400, gap: 18 }}>
        <div style={{ fontFamily: "Archivo Condensed", fontSize: 60, lineHeight: 0.95 }}>
          {record ? `${agent} hired as ${record.role}` : "No hire record"}
        </div>
        {c && (
          <div style={{ fontFamily: "Archivo", fontWeight: 600, fontSize: 26, color: OG.INK2 }}>
            {`${dollars(c.cost)} per verified fix · est.`}
          </div>
        )}
        {record && (
          <div style={{ fontFamily: "Archivo", fontWeight: 400, fontSize: 22, color: OG.INK3 }}>
            {`Approved by ${ownerOf(record)}${app ? ` in ${app[0]?.toUpperCase()}${app.slice(1)}` : ""} · built on Switch`}
          </div>
        )}
      </div>
    </div>,
    { ...size, fonts },
  );
}
