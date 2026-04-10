import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isValidEditorLinkUrl,
  LINK_PLACEHOLDER_URL,
  normalizeEditorLinkUrl,
  sanitizeEditorLinkUrl,
} from "./utils";

describe("link behavior utils", () => {
  test("normalizes common editor-friendly inputs", () => {
    strictEqual(
      normalizeEditorLinkUrl("  www.example.com  "),
      "https://www.example.com"
    );
    strictEqual(
      normalizeEditorLinkUrl("hello@example.com"),
      "mailto:hello@example.com"
    );
    strictEqual(
      normalizeEditorLinkUrl("tel:+5511999999999"),
      "tel:+5511999999999"
    );
  });

  test("validates only supported protocols and placeholder", () => {
    deepStrictEqual(
      [
        isValidEditorLinkUrl(LINK_PLACEHOLDER_URL),
        isValidEditorLinkUrl("https://example.com"),
        isValidEditorLinkUrl("mailto:test@example.com"),
        isValidEditorLinkUrl("javascript:alert(1)"),
        isValidEditorLinkUrl("not a url"),
        isValidEditorLinkUrl(""),
      ],
      [true, true, true, false, false, false]
    );
  });

  test("sanitizes unsupported protocols to about:blank", () => {
    deepStrictEqual(
      [
        sanitizeEditorLinkUrl("javascript:alert(1)"),
        sanitizeEditorLinkUrl("data:text/html,boom"),
        sanitizeEditorLinkUrl("https://example.com"),
      ],
      ["about:blank", "about:blank", "https://example.com"]
    );
  });
});
