import { getRecord, issueOf } from "@/lib/records";

export async function GET(_request: Request, ctx: RouteContext<"/records/[file]">) {
  const issue = issueOf((await ctx.params).file);
  const record = issue === null ? null : await getRecord(issue);
  if (!record)
    return Response.json({ error: "No tryout recorded for that issue." }, { status: 404 });
  return Response.json(record, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": record.source === "live" ? "no-store" : "public, max-age=300",
    },
  });
}
