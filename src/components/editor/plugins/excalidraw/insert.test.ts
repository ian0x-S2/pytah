import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
} from "lexical";
import type { LexicalEditor } from "lexical";

import { createEditorConfig } from "../../core/config";
import { computeFeatureNodes } from "../../core/features";
import { $isExcalidrawNode } from "../../core/nodes/excalidraw/node";
import { excalidrawFeature } from "./feature";
import { $insertExcalidrawBlock } from "./paste";

// Headless document seed: the drawing is never rendered here, so a minimal
// (non-restored) element shape is enough to count as content.
const SAVED_SCENE = JSON.stringify({
  appState: {},
  elements: [{ id: "el-1", isDeleted: false, type: "rectangle" }],
  files: {},
});

const createTestEditor = (): LexicalEditor => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: computeFeatureNodes([excalidrawFeature]),
  });
  return createHeadlessEditor({
    editable: config.editable,
    namespace: config.namespace,
    nodes: config.nodes,
    onError: (error) => {
      throw error;
    },
    theme: config.theme,
  });
};

const countDrawings = (editor: LexicalEditor): number => {
  let count = 0;
  editor.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      if ($isExcalidrawNode(child)) {
        count += 1;
      }
    }
  });
  return count;
};

const flush = async () => {
  await Promise.resolve();
};

/** Seed: saved drawing (via the insert helper, caret on its trailing
 * paragraph) followed by one text paragraph. */
const seedDocumentWithDrawing = async (editor: LexicalEditor) => {
  await editor.update(() => {
    const root = $getRoot();
    root.clear();
    $insertExcalidrawBlock(SAVED_SCENE);
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode("keep typing here"));
    root.append(paragraph);
  });
  await flush();
};

/** Mirrors the real slash-menu flow: the caret sits in a paragraph that
 * holds the typed query when the entry runs. */
const selectFirstParagraph = async (editor: LexicalEditor) => {
  await editor.update(() => {
    const paragraph = $getRoot()
      .getChildren()
      .find((child) => $isParagraphNode(child));
    if (!$isParagraphNode(paragraph)) {
      throw new Error("Expected a paragraph to hold the slash query");
    }

    const text = $createTextNode("query");
    paragraph.append(text);
    text.select(0);
  });
};

const runDrawingCommand = (editor: LexicalEditor): void => {
  const entry = excalidrawFeature.slashCommands?.find(
    (candidate) => candidate.command.id === "excalidraw"
  );
  if (!entry) {
    throw new Error("missing excalidraw slash contribution");
  }

  editor.update(() => {
    entry.run(editor);
  });
};

describe("inserting multiple drawings", () => {
  test("a second and third drawing can be inserted while one exists", async () => {
    const editor = createTestEditor();
    await seedDocumentWithDrawing(editor);
    strictEqual(countDrawings(editor), 1);

    await selectFirstParagraph(editor);
    runDrawingCommand(editor);
    await flush();

    editor.getEditorState().read(() => {
      strictEqual(countDrawings(editor), 2);
      const selection = $getSelection();
      strictEqual($isRangeSelection(selection), true);
    });

    // The just-inserted drawing leaves a fresh trailing paragraph under the
    // caret — inserting again from there must work the same way.
    await selectFirstParagraph(editor);
    runDrawingCommand(editor);
    await flush();

    editor.getEditorState().read(() => {
      strictEqual(countDrawings(editor), 3);
      const selection = $getSelection();
      strictEqual($isRangeSelection(selection), true);
    });
  });
});
