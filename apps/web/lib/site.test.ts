import { describe, expect, test } from "bun:test";
import { youtubeId } from "./site";

describe("youtubeId", () => {
  test("reads the video id from every common YouTube link", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?si=abc&v=dQw4w9WgXcQ&t=42",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      " https://m.youtube.com/live/dQw4w9WgXcQ ",
    ]) {
      expect(youtubeId(url)).toBe("dQw4w9WgXcQ");
    }
  });

  test("anything else shows the placeholder", () => {
    for (const url of [
      undefined,
      "",
      "https://vimeo.com/123456789",
      "https://evil.example/?u=https://youtu.be/dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQextra",
    ]) {
      expect(youtubeId(url)).toBeNull();
    }
  });
});
