import type { ProofReport } from "@tryouts/referee";
import type { Vendor } from "./index";

export type App = "slack" | "discord" | "mattermost";

export interface Tokens {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface Candidate {
  agent: string;
  bib: number;
  vendor: Vendor;
  label: string;
  model: string | null;
  machine: string;
  room: string;
  createdAt: string;
  readyAt: string | null;
  attempts: number;
  report: ProofReport | null;
  diff: { added: number; removed: number } | null;
  seconds: number | null;
  tokens: Tokens;
  cost: number;
  budget: { limit: number; spent: number; exhausted: boolean } | null;
  outcome: "hired" | "deleted" | null;
}

export interface Room {
  name: string;
  app: App;
  owner: string;
  group: string | null;
  url: string | null;
}

export interface FeedItem {
  at: string;
  actor: string;
  kind: "person" | "agent" | "referee" | "switch";
  room: string;
  text: string;
}

export interface Approval {
  command: string;
  options: string[];
  answer: string | null;
  answeredBy: string | null;
  askedAt: string;
  answeredAt: string | null;
  room: string;
}

export interface Merge {
  issue: number;
  title: string;
  agent: string;
  sha: string;
  merged: string;
  digest: string;
  trailers: string[];
  approval: Approval;
  at: string;
}

export interface TryoutRecord {
  version: 1;
  source: "recorded" | "live";
  issue: number;
  title: string;
  repository: string;
  role: string;
  posted: { by: string; room: string; text: string; at: string };
  startedAt: string;
  endedAt: string | null;
  rule: string;
  candidates: Candidate[];
  rooms: Room[];
  feed: FeedItem[];
  hire: Merge | null;
  refusal: { text: string; at: string } | null;
  admitted: { by: string; room: string; commands: string[]; at: string } | null;
  deletions: { agent: string; confirmedBy: string; at: string }[];
  probation: { of: number; fixes: (Merge & { reportedBy: string; room: string })[] };
  prices: { asOf: string; perMillion: Record<string, Tokens> };
}
