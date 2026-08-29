import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_EDITOR_CHROME,
  DEFAULT_EDITOR_FEATURES,
  renderEditorSlot,
  resolveEditorChrome,
  resolveEditorFeatures,
  shouldRenderEditorShell,
} from "./composition";

describe("editor composition", () => {
  test("resolves feature flags over defaults", () => {
    deepStrictEqual(resolveEditorFeatures(), DEFAULT_EDITOR_FEATURES);
    deepStrictEqual(
      resolveEditorFeatures({
        floatingToolbar: false,
        history: false,
      }),
      {
        ...DEFAULT_EDITOR_FEATURES,
        floatingToolbar: false,
        history: false,
      }
    );
  });

  test("resolves the nested snapshot bag without losing sibling defaults", () => {
    deepStrictEqual(resolveEditorFeatures().snapshot, {
      emitInitialSnapshot: true,
      html: true,
      markdown: true,
      text: true,
    });
    // A partial override merges against the snapshot defaults only — the
    // flat flags and the other snapshot outputs keep their defaults.
    deepStrictEqual(resolveEditorFeatures({ snapshot: { html: false } }), {
      ...DEFAULT_EDITOR_FEATURES,
      snapshot: {
        emitInitialSnapshot: true,
        html: false,
        markdown: true,
        text: true,
      },
    });
  });

  test("resolves chrome options over defaults", () => {
    deepStrictEqual(resolveEditorChrome(), DEFAULT_EDITOR_CHROME);
    deepStrictEqual(resolveEditorChrome({ header: false, outputs: false }), {
      ...DEFAULT_EDITOR_CHROME,
      header: false,
      outputs: false,
    });
  });

  test("renders slots as values or callbacks", () => {
    strictEqual(renderEditorSlot("header", { value: 1 }), "header");
    strictEqual(
      renderEditorSlot(({ value }: { value: number }) => value * 2, {
        value: 3,
      }),
      6
    );
    strictEqual(renderEditorSlot(undefined, { value: 1 }), undefined);
  });

  test("allows custom shell slot in minimal mode", () => {
    strictEqual(
      shouldRenderEditorShell({
        chromeShell: false,
        minimal: true,
        shellSlot: "custom-shell",
      }),
      true
    );
    strictEqual(
      shouldRenderEditorShell({
        chromeShell: true,
        minimal: true,
        shellSlot: undefined,
      }),
      false
    );
  });
});
