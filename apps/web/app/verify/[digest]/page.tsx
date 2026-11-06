import type { Metadata } from "next";
import { evidenceFrom, VerifyPage } from "@/components/verify/verify-page";
import { listRecords } from "@/lib/records";

export const metadata: Metadata = { title: "Verify it yourself" };

export async function generateStaticParams() {
  return evidenceFrom(await listRecords()).map((e) => ({
    digest: e.report.digest.replace("sha256:", ""),
  }));
}

export default async function VerifyDigest({ params }: PageProps<"/verify/[digest]">) {
  const { digest } = await params;
  const value = decodeURIComponent(digest).toLowerCase();
  return (
    <VerifyPage
      records={await listRecords()}
      digest={value.startsWith("sha256:") ? value : `sha256:${value}`}
    />
  );
}
