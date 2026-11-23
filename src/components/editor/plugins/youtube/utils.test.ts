import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { parseYouTubeUrl } from "./utils";

describe("youtube utils", () => {
  test("extracts a video id from supported url shapes", () => {
    deepStrictEqual(
      [
        parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"),
        parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42"),
        parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
      ],
      ["dQw4w9WgXcQ", "dQw4w9WgXcQ", "dQw4w9WgXcQ"]
    );
  });

  test("rejects invalid ids, spoofing hosts and unrelated urls", () => {
    strictEqual(parseYouTubeUrl("https://example.com/video"), null);
    strictEqual(parseYouTubeUrl("https://youtu.be/short"), null);
    strictEqual(parseYouTubeUrl("not a youtube url"), null);
    strictEqual(
      parseYouTubeUrl("https://notyoutube.com/watch?v=dQw4w9WgXcQ"),
      null
    );
    strictEqual(
      parseYouTubeUrl("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"),
      null
    );
    strictEqual(
      parseYouTubeUrl("javascript://youtube.com/watch?v=dQw4w9WgXcQ"),
      null
    );
    strictEqual(
      parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ"
    );
    strictEqual(
      parseYouTubeUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"),
      "dQw4w9WgXcQ"
    );
  });
});
