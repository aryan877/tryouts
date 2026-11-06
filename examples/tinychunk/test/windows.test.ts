import { expect, test } from "bun:test";
import { windows } from "../src/windows";

test("returns no windows when the list is shorter than the size", () => {
  expect(windows([1, 2], 3)).toEqual([]);
});

test("rejects a size that is not a positive integer", () => {
  expect(() => windows([1], 0)).toThrow(RangeError);
});
