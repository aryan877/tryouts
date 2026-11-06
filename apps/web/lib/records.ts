import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { TryoutRecord } from "@tryouts/kit/record";
import { cache } from "react";
import { FIXTURE } from "./fixture";
import { ms } from "./format";

const DIR = join(process.cwd(), "records");
const FILE = /^(\d+)\.json$/;

export const usingFixture = process.env.TRYOUTS_SOURCE === "fixture";

async function readRecord(name: string): Promise<TryoutRecord | null> {
  const record = JSON.parse(await readFile(join(DIR, name), "utf8")) as TryoutRecord;
  return record.version === 1 ? record : null;
}

export const listRecords = cache(async (): Promise<TryoutRecord[]> => {
  if (usingFixture) return [FIXTURE];
  const names = await readdir(DIR).catch(() => [] as string[]);
  const records = await Promise.all(names.filter((name) => FILE.test(name)).map(readRecord));
  return records
    .filter((record): record is TryoutRecord => record !== null)
    .sort((a, b) => ms(b.startedAt) - ms(a.startedAt));
});

export async function getRecord(issue: number): Promise<TryoutRecord | null> {
  return (await listRecords()).find((record) => record.issue === issue) ?? null;
}

export async function getHire(agent: string): Promise<TryoutRecord | null> {
  return (await listRecords()).find((record) => record.hire?.agent === agent) ?? null;
}

export const issueOf = (file: string) => {
  const match = FILE.exec(file);
  return match ? Number(match[1]) : null;
};
