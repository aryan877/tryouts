export async function sh(
  argv: string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<string> {
  const proc = Bun.spawn(argv, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...env },
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`${argv.join(" ")} exited ${code}: ${(err || out).trim()}`);
  return out.trim();
}

export async function waitFor<T>(
  what: string,
  probe: () => Promise<T | null | undefined | false>,
  timeoutMs: number,
  intervalMs = 2_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await Bun.sleep(intervalMs);
  }
  const reason = lastError instanceof Error ? `: ${lastError.message}` : "";
  throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s waiting for ${what}${reason}`);
}

export const step = (message: string) => console.log(`\x1b[36m›\x1b[0m ${message}`);
