export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly url: string,
    readonly body: string,
  ) {
    super(`${method} ${url} → ${status}: ${body.slice(0, 500)}`);
  }
}

export async function request<T>(
  base: string,
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<T> {
  const url = `${base}${path}`;
  const response = await fetch(url, {
    method,
    headers: body === undefined ? headers : { ...headers, "Content-Type": "application/json" },
    body: body === undefined ? null : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new HttpError(response.status, method, url, text);
  return (text ? JSON.parse(text) : undefined) as T;
}
