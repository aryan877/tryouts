import { ImageResponse } from "next/og";
import { appOf, ownerOf } from "@/lib/board";
import { dollars } from "@/lib/format";
import { OG, OgCard, OgMark, ogFonts } from "@/lib/og";
import { getHire } from "@/lib/records";

export async function GET(_request: Request, ctx: RouteContext<"/hires/[agent]/card.png">) {
  const { agent } = await ctx.params;
  const record = await getHire(agent);
  const c = record?.candidates.find((x) => x.agent === agent);
  const hire = record?.hire;
  if (!record || !c || !hire) return new Response("No hire record", { status: 404 });
  const app = appOf(record, hire.approval.room);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: OG.SCREEN,
        padding: 72,
        color: OG.INK,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <OgMark size={36} />
        <div style={{ fontFamily: "Archivo", fontWeight: 600, fontSize: 34 }}>Tryouts</div>
        <div
          style={{
            fontFamily: "Archivo",
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: 2,
            color: OG.INK3,
            marginLeft: "auto",
          }}
        >
          HIRE RECORD
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 56 }}>
        <OgCard record={record} candidate={c} scale={1.56} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 10 }}>
        <div
          style={{ fontFamily: "Archivo Condensed", fontSize: 64, lineHeight: 1 }}
        >{`${agent} hired as ${record.role}`}</div>
        <div style={{ fontFamily: "Archivo", fontWeight: 400, fontSize: 26, color: OG.INK2 }}>
          {`${dollars(c.cost)} per verified fix · est. · approved by ${ownerOf(record)}${app ? ` in ${app[0]?.toUpperCase()}${app.slice(1)}` : ""} · built on Switch`}
        </div>
      </div>
    </div>,
    {
      width: 1080,
      height: 1350,
      fonts: await ogFonts(),
      headers: { "Content-Disposition": `inline; filename="${agent}-hire-card.png"` },
    },
  );
}
