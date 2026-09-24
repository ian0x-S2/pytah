import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// DOM globals must exist before Lexical evaluates its CAN_USE_DOM checks,
// so happy-dom is registered up front and Lexical is imported dynamically.
// The registration is released afterwards so sibling test files can manage
// their own DOM globals.
GlobalRegistrator.register();
after(() => {
  GlobalRegistrator.unregister();
});

const {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
} = await import("lexical");
const {
  decideInsertAfter,
  isOnBlockDragHandleTarget,
  readBlockDragKey,
  resolveDropTarget,
  DRAG_DATA_FORMAT,
} = await import("./drop-target");
const { focusDroppedBlock, moveDraggedBlock } =
  await import("./drop-placement");

function stubTransfer(getData: (format: string) => string): DataTransfer {
  return { getData } as unknown as DataTransfer;
}

function stubRect(
  element: Element,
  rect: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  }
): void {
  element.getBoundingClientRect = () =>
    ({
      bottom: rect.bottom,
      height: rect.bottom - rect.top,
      left: rect.left,
      right: rect.right,
      toJSON: () => {},
      top: rect.top,
      width: rect.right - rect.left,
      x: rect.left,
      y: rect.top,
    }) as DOMRect;
}

describe("block drag start capture", () => {
  test("recognizes targets inside the drag handle", () => {
    const menu = document.createElement("div");
    const handleChild = document.createElement("span");
    const handleIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    menu.append(handleChild, handleIcon);

    strictEqual(isOnBlockDragHandleTarget(handleChild, menu), true);
    strictEqual(isOnBlockDragHandleTarget(handleIcon, menu), true);
    strictEqual(
      isOnBlockDragHandleTarget(document.createElement("div"), menu),
      false
    );
    strictEqual(isOnBlockDragHandleTarget(null, menu), false);
  });
});

describe("drop-target math", () => {
  test("decideInsertAfter splits at the target top edge", () => {
    strictEqual(decideInsertAfter(99, 100), false);
    strictEqual(decideInsertAfter(100, 100), true);
    strictEqual(decideInsertAfter(250, 100), true);
  });

  test("readBlockDragKey only accepts the block payload", () => {
    strictEqual(readBlockDragKey(null), null);
    strictEqual(
      readBlockDragKey(
        stubTransfer((format) => (format === DRAG_DATA_FORMAT ? "42" : ""))
      ),
      "42"
    );
    strictEqual(readBlockDragKey(stubTransfer(() => "")), null);
    strictEqual(
      readBlockDragKey(
        stubTransfer(() => {
          throw new Error("protected mode");
        })
      ),
      null
    );
  });
});

describe("resolveDropTarget", () => {
  test("hits blocks by viewport coordinates while scrolled", async () => {
    const editor = createEditor({
      onError: (error) => {
        throw error;
      },
    });
    const anchor = document.createElement("div");
    document.body.append(anchor);
    editor.setRootElement(anchor);

    let keys: string[] = [];
    editor.update(() => {
      const root = $getRoot();
      for (const text of ["first", "second", "third"]) {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        root.append(paragraph);
      }
      keys = root.getChildrenKeys();
    });
    // Non-discrete seeding commits async in this environment.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const elements = keys.map((key) => {
      const element = editor.getElementByKey(key);
      ok(element instanceof HTMLElement);
      return element;
    });
    for (const element of elements) {
      element.style.marginTop = "0px";
      element.style.marginBottom = "0px";
    }
    stubRect(anchor, { bottom: 300, left: 0, right: 800, top: 0 });
    stubRect(elements[0], { bottom: 100, left: 200, right: 700, top: 0 });
    stubRect(elements[1], { bottom: 200, left: 200, right: 700, top: 100 });
    stubRect(elements[2], { bottom: 300, left: 200, right: 700, top: 200 });

    // Viewport-space hit: the middle of the second block resolves even
    // though a pageY-style coordinate would be hundreds of px lower.
    strictEqual(resolveDropTarget(editor, anchor, 400, 150), elements[1]);
    strictEqual(resolveDropTarget(editor, anchor, 400, 20), elements[0]);
    // Above the first block without edge defaults resolves nothing.
    strictEqual(resolveDropTarget(editor, anchor, 400, -30), null);
    // With edge defaults the document edges clamp to first/last.
    strictEqual(resolveDropTarget(editor, anchor, 400, -30, true), elements[0]);
    strictEqual(resolveDropTarget(editor, anchor, 400, 900, true), elements[2]);
  });
});

describe("focusDroppedBlock", () => {
  test("restores editor focus and keeps the moved block in view", () => {
    const editor = createEditor({
      onError: (error) => {
        throw error;
      },
    });
    const root = document.createElement("div");
    root.contentEditable = "true";
    root.tabIndex = -1;
    document.body.append(root);
    editor.setRootElement(root);

    const movedBlock = document.createElement("div");
    root.append(movedBlock);

    let focusOptions: FocusOptions | undefined;
    const nativeFocus = root.focus.bind(root) as (
      options?: FocusOptions
    ) => void;
    root.focus = ((options?: FocusOptions) => {
      focusOptions = options;
      nativeFocus(options);
    }) as typeof root.focus;

    let scrollOptions: ScrollIntoViewOptions | undefined;
    movedBlock.scrollIntoView = ((
      options?: boolean | ScrollIntoViewOptions
    ) => {
      scrollOptions = typeof options === "object" ? options : undefined;
    }) as typeof movedBlock.scrollIntoView;

    root.blur();
    focusDroppedBlock(editor, movedBlock);

    strictEqual(document.activeElement, root);
    strictEqual(focusOptions?.preventScroll, true);
    deepStrictEqual(scrollOptions, { block: "nearest", inline: "nearest" });
  });
});

describe("moveDraggedBlock", () => {
  test("moves the block to the correct side and parks the caret on it", async () => {
    const editor = createEditor({
      onError: (error) => {
        throw error;
      },
    });
    const anchor = document.createElement("div");
    document.body.append(anchor);
    editor.setRootElement(anchor);

    let keys: string[] = [];
    editor.update(() => {
      const root = $getRoot();
      for (const text of ["alpha", "bravo", "charlie"]) {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        root.append(paragraph);
      }
      keys = root.getChildrenKeys();
    });
    // Non-discrete seeding commits async in this environment.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const readOrder = (): string[] =>
      editor.getEditorState().read(() =>
        $getRoot()
          .getTextContent()
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "")
      );

    const target = editor.getElementByKey(keys[0]);
    ok(target instanceof HTMLElement);
    stubRect(target, { bottom: 100, left: 0, right: 800, top: 0 });

    // Drop above the first block: charlie moves before alpha.
    const moved = moveDraggedBlock(editor, keys[2], target, -10);
    ok(moved instanceof HTMLElement);
    deepStrictEqual(readOrder(), ["charlie", "alpha", "bravo"]);

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      ok($isRangeSelection(selection));
      strictEqual(selection.isCollapsed(), true);
    });
    const caretKey = editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.anchor.key : null;
    });
    const firstTextKey = editor.getEditorState().read(() => {
      const root = $getRoot();
      return root.getFirstDescendant()?.getKey() ?? null;
    });
    // The caret parks at the start of the moved block (now first).
    strictEqual(caretKey, firstTextKey);

    // Dropping a block onto itself keeps order and still selects it.
    const same = moveDraggedBlock(editor, keys[2], moved, 10);
    ok(same instanceof HTMLElement);
    deepStrictEqual(readOrder(), ["charlie", "alpha", "bravo"]);

    // Unknown keys resolve to null without touching the document.
    strictEqual(moveDraggedBlock(editor, "nope", target, 10), null);
    deepStrictEqual(readOrder(), ["charlie", "alpha", "bravo"]);
  });
});
