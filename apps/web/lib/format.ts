const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export function elapsed(seconds: number): string {
  const tenths = Math.max(0, Math.floor(seconds * 10));
  const s = Math.floor(tenths / 10);
  if (s >= 3_600)
    return `${Math.floor(s / 3_600)}:${pad(Math.floor((s % 3_600) / 60))}:${pad(s % 60)}`;
  return `${Math.floor(s / 60)}:${pad(s % 60)}.${tenths % 10}`;
}

export function tokens(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n < 1_000_000) return `${Math.round(n / 1_000)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

export const dollars = (usd: number) => (usd < 0.01 ? "<$0.01" : `$${usd.toFixed(2)}`);

export const diff = (d: { added: number; removed: number }) => `+${d.added} −${d.removed}`;

export const sha7 = (sha: string) => sha.slice(0, 7);

export function digestShort(digest: string): string {
  const hex = digest.replace(/^sha256:/, "");
  return `sha256:${hex.slice(0, 4)}…${hex.slice(-4)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function clock(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function shortClock(iso: string): string {
  return clock(iso).slice(0, 5);
}

export function day(iso: string, year = true): string {
  const d = new Date(iso);
  const text = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return year ? `${text} ${d.getUTCFullYear()}` : text;
}

export function stampDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]?.toUpperCase()} ${d.getUTCFullYear()}`;
}

export const ms = (iso: string) => Date.parse(iso);

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
