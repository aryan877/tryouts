export const GITHUB_URL = "https://github.com/aryan877/tryouts";
export const SWITCH_URL = "https://github.com/sandbox-quantum/switch";
export const TEMPLATE_URLS = [
  `https://raw.githubusercontent.com/aryan877/tryouts/main/templates/tryouts-team.yaml`,
  `https://raw.githubusercontent.com/aryan877/tryouts/main/templates/tryout.yaml`,
  `https://raw.githubusercontent.com/aryan877/tryouts/main/templates/bugs-room.yaml`,
] as const;
export const VIDEO_URL = process.env.NEXT_PUBLIC_TRYOUTS_VIDEO || null;

export function commitUrl(repository: string, sha: string): string | null {
  const match = /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(repository);
  return match ? `https://github.com/${match[1]}/commit/${sha}` : null;
}
