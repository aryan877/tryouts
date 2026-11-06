export interface RunResult {
  code: number;
  output: string;
  timedOut: boolean;
}

export interface RunOptions {
  timeoutMs?: number;
  env?: Record<string, string | undefined>;
  onTimeout?: () => void;
}

const QUIET = { GIT_TERMINAL_PROMPT: "0", NO_COLOR: "1", FORCE_COLOR: "0" };
const MAX_OUTPUT = 64_000;
const GRACE_MS = 1_000;

function collect(...streams: ReadableStream<Uint8Array>[]) {
  let text = "";
  const decoder = new TextDecoder();
  const readers = streams.map((stream) => stream.getReader());
  const done = Promise.all(
    readers.map(async (reader) => {
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        text = `${text}${decoder.decode(chunk.value, { stream: true })}`.slice(-MAX_OUTPUT);
      }
    }),
  ).catch(() => undefined);
  return {
    done,
    text: () => text.trim(),
    stop: () => Promise.all(readers.map((reader) => reader.cancel().catch(() => undefined))),
  };
}

export async function run(
  argv: string[],
  cwd: string,
  options: RunOptions = {},
): Promise<RunResult> {
  const proc = Bun.spawn(argv, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...(options.env ?? process.env), ...QUIET },
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
    options.onTimeout?.();
  }, options.timeoutMs ?? 60_000);
  const output = collect(proc.stdout, proc.stderr);
  const code = await proc.exited;
  clearTimeout(timer);
  await Promise.race([output.done, Bun.sleep(GRACE_MS)]);
  await output.stop();
  return { code, output: output.text(), timedOut };
}

export async function git(cwd: string, ...args: string[]): Promise<string> {
  const { code, output } = await run(["git", "-c", "core.hooksPath=/dev/null", ...args], cwd);
  if (code !== 0) throw new Error(`git ${args.join(" ")} failed: ${output}`);
  return output;
}
