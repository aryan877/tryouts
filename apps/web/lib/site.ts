export const GITHUB_URL = "https://github.com/aryan877/tryouts";
export const SWITCH_URL = "https://github.com/sandbox-quantum/switch";
export const VIDEO_URL = process.env.NEXT_PUBLIC_TRYOUTS_VIDEO || null;

const GITHUB = /^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/;

export const repoName = (repository: string) => GITHUB.exec(repository)?.[1] ?? null;

function githubUrl(repository: string, path: string): string | null {
  const name = repoName(repository);
  return name ? `https://github.com/${name}/${path}` : null;
}

export const commitUrl = (repository: string, sha: string) =>
  githubUrl(repository, `commit/${sha}`);

export const issueUrl = (repository: string, issue: number) =>
  githubUrl(repository, `issues/${issue}`);
