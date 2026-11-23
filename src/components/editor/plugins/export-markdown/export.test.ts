import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { getMarkdownExportFilename } from "./export";

describe("export-markdown utils", () => {
  test("derives a slugified filename from the first non-empty line", () => {
    strictEqual(
      getMarkdownExportFilename("\n\n  Hello, Pytah Editor! \nSecond line"),
      "hello-pytah-editor"
    );
  });

  test("falls back to document for blank or punctuation-only content", () => {
    strictEqual(getMarkdownExportFilename(""), "document");
    strictEqual(getMarkdownExportFilename("   \n  "), "document");
    strictEqual(getMarkdownExportFilename("!!! ???"), "document");
  });

  test("truncates long titles to 60 characters", () => {
    const longTitle = "a".repeat(80);
    strictEqual(getMarkdownExportFilename(longTitle).length, 60);
  });
});
