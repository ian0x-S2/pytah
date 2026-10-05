// Pure helpers of the floating link editor's anchor/selection readers. See
// `floating-link-editor-reducer.test.ts` for why DOM-heavy plugin flows are
// not covered by this runner: this file only needs a cheap DOM subtree to
// model alive vs. dead native selections, patched in via `getSelection`.
import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// DOM globals must exist before modules that run CAN_USE_DOM checks load.
GlobalRegistrator.register();

const { isNativeSelectionWithinEditor } =
  await import("./floating-link-editor-position");

after(() => {
  GlobalRegistrator.unregister();
});

const root = document.createElement("div");
const text = document.createTextNode("linked text");
root.append(text);
document.body.append(root);

const selectionLike = (
  overrides: Partial<{
    anchorNode: Node | null;
    rangeCount: number;
  }> = {}
): Selection =>
  ({
    anchorNode: text,
    focusNode: text,
    rangeCount: 1,
    ...overrides,
  }) as unknown as Selection;

describe("isNativeSelectionWithinEditor", () => {
  test("true when the anchor node is inside the root", () => {
    strictEqual(isNativeSelectionWithinEditor(root, selectionLike()), true);
  });

  test("false when the native selection died (no ranges)", () => {
    strictEqual(
      isNativeSelectionWithinEditor(root, selectionLike({ rangeCount: 0 })),
      false
    );
  });

  test("false when the anchor node left the root", () => {
    const outside = document.createElement("span");
    document.body.append(outside);
    strictEqual(
      isNativeSelectionWithinEditor(
        root,
        selectionLike({ anchorNode: outside })
      ),
      false
    );
  });

  test("false when there is no native selection at all", () => {
    strictEqual(isNativeSelectionWithinEditor(root, null), false);
  });

  test("false when the editor root is gone", () => {
    deepStrictEqual(
      [isNativeSelectionWithinEditor(null, selectionLike())],
      [false]
    );
  });
});
