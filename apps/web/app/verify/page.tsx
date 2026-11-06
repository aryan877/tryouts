import type { Metadata } from "next";
import { VerifyPage } from "@/components/verify/verify-page";
import { listRecords } from "@/lib/records";

export const metadata: Metadata = { title: "Verify it yourself" };

export default async function Verify() {
  return <VerifyPage records={await listRecords()} digest={null} />;
}
