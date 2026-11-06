export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`size must be a positive integer, got ${size}`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < Math.floor(items.length / size); i++) {
    chunks.push(items.slice(i * size, (i + 1) * size));
  }
  return chunks;
}
