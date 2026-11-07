export const GITHUB_URL = "https://github.com/aryan877/tryouts";
export const SWITCH_URL = "https://github.com/sandbox-quantum/switch";
export const SWITCH_SITE = "https://www.switchagents.ai";
export const TEMPLATES_URL = `${GITHUB_URL}/tree/main/templates`;
export const JUDGES_URL = `${GITHUB_URL}/blob/main/JUDGES.md`;
export const DEMO_URL = "https://github.com/aryan877/tinychunk";
export const VIDEO_URL = process.env.NEXT_PUBLIC_TRYOUTS_VIDEO || "https://youtu.be/SAHizcJhf7c";

const YOUTUBE =
  /^https:\/\/(?:(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})(?![\w-])/;

export const youtubeId = (url: string | undefined) =>
  url ? (YOUTUBE.exec(url.trim())?.[1] ?? null) : null;
