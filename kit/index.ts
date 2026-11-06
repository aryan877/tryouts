export type PersonKey = "lead" | "community";
export type Vendor = "claude" | "codex" | "opencode" | "opencode2";
export type Cast = PersonKey | "hiring" | "referee" | "candidate";

export interface Person {
  name: string;
  email: string;
  chat: string;
  role: string;
}

export const PEOPLE: Record<PersonKey, Person> = {
  lead: { name: "Arjun", email: "arjun@tryouts.local", chat: "arjun", role: "Engineering lead" },
  community: { name: "Riya", email: "riya@tryouts.local", chat: "riya", role: "Community lead" },
};

export const MACHINE = "arjun-laptop";

export const AGENTS = {
  hiring: { name: "hiring", displayName: "Hiring manager" },
  referee: { name: "referee", displayName: "Referee" },
} as const;

export const ROOMS = { hiring: "hiring", bugs: "bugs" } as const;
export const ALIAS = "bugfixer";

export const VENDORS: Record<Vendor, { provider: "claude" | "codex" | "opencode"; label: string }> =
  {
    claude: { provider: "claude", label: "Claude Code" },
    codex: { provider: "codex", label: "Codex" },
    opencode: { provider: "opencode", label: "OpenCode" },
    opencode2: { provider: "opencode", label: "OpenCode" },
  };

export const ISSUES = {
  tryout: { number: 12, title: "chunk() drops the last partial chunk" },
  probation: { number: 13, title: "windows() skips the final window" },
} as const;

export const candidateName = (vendor: Vendor, issue: number) => `${vendor}-${issue}`;
export const tryoutRoom = (vendor: Vendor, issue: number) => `tryout-${issue}-${vendor}`;
export const branchOf = (agent: string) => `tryout/${agent}`;

const CANDIDATE = /^(claude|codex|opencode2?)-(\d+)$/;

export function parseCandidate(agent: string): { vendor: Vendor; issue: number } | null {
  const match = CANDIDATE.exec(agent);
  return match ? { vendor: match[1] as Vendor, issue: Number(match[2]) } : null;
}

export function castOf(agent: string): Cast | null {
  if (agent === AGENTS.hiring.name) return "hiring";
  if (agent === AGENTS.referee.name) return "referee";
  return parseCandidate(agent) ? "candidate" : null;
}
