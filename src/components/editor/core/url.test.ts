import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  isValidEditorLinkUrl,
  normalizeEditorLinkUrl,
  sanitizeHrefUrl,
  sanitizeMediaUrl,
  sanitizeWebUrl,
} from "./url";

describe("core/url", () => {
  test("normalizeEditorLinkUrl avoids double mailto and preserves explicit schemes", () => {
    strictEqual(
      normalizeEditorLinkUrl("mailto:user@example.com"),
      "mailto:user@example.com"
    );
    strictEqual(
      normalizeEditorLinkUrl("MAILTO:user@example.com"),
      "MAILTO:user@example.com"
    );
    strictEqual(
      normalizeEditorLinkUrl("user@example.com"),
      "mailto:user@example.com"
    );
    strictEqual(
      normalizeEditorLinkUrl("javascript:alert('a@b')"),
      "javascript:alert('a@b')"
    );
    strictEqual(
      normalizeEditorLinkUrl("www.pytah.dev"),
      "https://www.pytah.dev"
    );
  });

  test("sanitizeHrefUrl blocks unsafe schemes and malformed values", () => {
    strictEqual(
      sanitizeHrefUrl("https://pytah.dev/docs"),
      "https://pytah.dev/docs"
    );
    strictEqual(sanitizeHrefUrl("mailto:hi@pytah.dev"), "mailto:hi@pytah.dev");
    strictEqual(sanitizeHrefUrl("tel:+5511999999999"), "tel:+5511999999999");
    strictEqual(sanitizeHrefUrl("javascript:alert(1)"), "about:blank");
    strictEqual(sanitizeHrefUrl("vbscript:msgbox(1)"), "about:blank");
    strictEqual(
      sanitizeHrefUrl("data:text/html,<script>1</script>"),
      "about:blank"
    );
    strictEqual(sanitizeHrefUrl("not a valid url"), "about:blank");
    strictEqual(sanitizeHrefUrl("   "), "about:blank");
  });

  test("sanitizeWebUrl allows only http(s)", () => {
    strictEqual(sanitizeWebUrl("https://pytah.dev"), "https://pytah.dev");
    strictEqual(
      sanitizeWebUrl("http://localhost:5173"),
      "http://localhost:5173"
    );
    strictEqual(sanitizeWebUrl("mailto:a@b.com"), null);
    strictEqual(sanitizeWebUrl("javascript:alert(1)"), null);
    strictEqual(sanitizeWebUrl("file:///etc/passwd"), null);
  });

  test("sanitizeMediaUrl allows safe media sources and blocks SVG data URIs and scripts", () => {
    strictEqual(
      sanitizeMediaUrl("https://cdn.example.com/photo.png"),
      "https://cdn.example.com/photo.png"
    );
    strictEqual(
      sanitizeMediaUrl("data:image/png;base64,AAAA", { allowDataImage: true }),
      "data:image/png;base64,AAAA"
    );
    strictEqual(sanitizeMediaUrl("data:image/png;base64,AAAA"), null);
    strictEqual(
      sanitizeMediaUrl("blob:https://pytah.dev/1234"),
      "blob:https://pytah.dev/1234"
    );
    strictEqual(sanitizeMediaUrl("/images/hero.webp"), "/images/hero.webp");
    strictEqual(
      sanitizeMediaUrl("data:image/svg+xml,<svg/>", { allowDataImage: true }),
      null
    );
    strictEqual(sanitizeMediaUrl("javascript:alert(1)"), null);
    strictEqual(sanitizeMediaUrl("file:///etc/passwd"), null);
    strictEqual(sanitizeMediaUrl("//evil.example/x.png"), null);
  });

  test("isValidEditorLinkUrl rejects javascript payloads containing @", () => {
    strictEqual(
      isValidEditorLinkUrl(normalizeEditorLinkUrl("javascript:alert('a@b')")),
      false
    );
  });
});
