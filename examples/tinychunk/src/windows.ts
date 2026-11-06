export function windows<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`size must be a positive integer, got ${size}`);
  }
  const result: T[][] = [];
  for (let start = 0; start < items.length - size; start++) {
    result.push(items.slice(start, start + size));
  }
  return result;
}
