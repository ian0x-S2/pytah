import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { createHeadlessEditor } from "@lexical/headless";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  type LexicalNode,
} from "lexical";
import { createEditorConfig } from "../../core/config";
import { computeFeatureNodes } from "../../core/features";
import type { ExtraEditorFeature } from "../../core/types";
import { createEmptyEditorState } from "../../core/utils";
import { collapsibleFeature } from "../collapsible/feature";
import { replaceElementWithCollapsible } from "../collapsible/utils";
import { excalidrawFeature } from "../excalidraw/feature";
import { DEFAULT_LAYOUT_TEMPLATE } from "../layout/constants";
import { layoutFeature } from "../layout/feature";
import { applyLayoutPreset } from "../layout/utils";
import { mathFeature } from "../math/feature";
import { CORE_SLASH_COMMAND_EXECUTORS } from "./executors";

// replaceCurrentBlock requires an anchored text node, mirroring the real
// slash-menu flow where the typed query gets cleared.
const selectParagraphText = (
  editor: ReturnType<typeof createTestEditor>
): void => {
  editor.update(() => {
    const root = $getRoot();
    const paragraph = root.getFirstChildOrThrow();

    if (!$isParagraphNode(paragraph)) {
      throw new Error("Expected initial paragraph node");
    }

    const text = $createTextNode("query");
    paragraph.append(text);
    text.select(0);
  });
};

const createTestEditor = (extras: readonly ExtraEditorFeature[]) => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: computeFeatureNodes(extras),
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

const flushEditorUpdates = async () => {
  await Promise.resolve();
};

const initializeEditor = async (
  editor: ReturnType<typeof createTestEditor>
) => {
  createEmptyEditorState(editor);
  await flushEditorUpdates();
};

const expectElementNode = (node: LexicalNode) => {
  strictEqual($isElementNode(node), true);

  if (!$isElementNode(node)) {
    throw new Error("Expected element node");
  }

  return node;
};

const getCommandRun =
  (feature: ExtraEditorFeature, commandId: string) =>
  (
    editor: Parameters<
      NonNullable<ExtraEditorFeature["slashCommands"]>[number]["run"]
    >[0]
  ) => {
    const entry = feature.slashCommands?.find(
      (candidate) => candidate.command.id === commandId
    );
    if (!entry) {
      throw new Error(`missing slash command contribution: ${commandId}`);
    }
    entry.run(editor);
  };

describe("slash command executors", () => {
  test("creates a default 3-column table structure", async () => {
    const editor = createTestEditor([]);
    await initializeEditor(editor);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      CORE_SLASH_COMMAND_EXECUTORS.table?.(paragraph);
    });

    await flushEditorUpdates();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const tableNode = expectElementNode(root.getFirstChildOrThrow());

      strictEqual(tableNode.getType(), "table");
      strictEqual(tableNode.getChildrenSize(), 2);

      const headerRow = expectElementNode(tableNode.getFirstChildOrThrow());
      const bodyRow = expectElementNode(tableNode.getLastChildOrThrow());

      strictEqual(headerRow.getChildrenSize(), 3);
      strictEqual(bodyRow.getChildrenSize(), 3);
    });
  });

  test("creates a layout container matching the default preset", async () => {
    const editor = createTestEditor([layoutFeature]);
    await initializeEditor(editor);

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      applyLayoutPreset(paragraph, DEFAULT_LAYOUT_TEMPLATE);
    });

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const layoutContainer = expectElementNode(root.getFirstChildOrThrow());

      strictEqual(layoutContainer.getType(), "layout-container");
      strictEqual("getTemplateColumns" in layoutContainer, true);
      strictEqual(
        (
          layoutContainer as unknown as { getTemplateColumns: () => string }
        ).getTemplateColumns(),
        DEFAULT_LAYOUT_TEMPLATE
      );
    });
  });

  test("replaces a paragraph with a collapsible structure", async () => {
    const editor = createTestEditor([collapsibleFeature]);
    await initializeEditor(editor);

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      replaceElementWithCollapsible(paragraph);
    });

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const container = expectElementNode(root.getFirstChildOrThrow());

      strictEqual(container.getType(), "collapsible-container");
      strictEqual(container.getChildrenSize(), 2);
      strictEqual(
        container.getFirstChildOrThrow().getType(),
        "collapsible-title"
      );
      strictEqual(
        container.getLastChildOrThrow().getType(),
        "collapsible-content"
      );
    });
  });

  test("replaces a paragraph with a math block and trailing paragraph", async () => {
    const editor = createTestEditor([mathFeature]);
    await initializeEditor(editor);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      paragraph.select();
    });

    selectParagraphText(editor);
    getCommandRun(mathFeature, "math")(editor);
    await flushEditorUpdates();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      strictEqual(root.getChildrenSize(), 2);
      const mathNode = root.getFirstChildOrThrow();
      strictEqual(mathNode.getType(), "math");
      const trailingParagraph = root.getLastChildOrThrow();
      strictEqual(trailingParagraph.getType(), "paragraph");
    });
  });

  test("replaces a paragraph with an empty drawing and re-anchors selection", async () => {
    const editor = createTestEditor([excalidrawFeature]);
    await initializeEditor(editor);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      // Mirror the slash menu flow: the replaced paragraph holds the anchor
      // selection, so the executor must leave a valid selection behind.
      paragraph.select();
    });

    selectParagraphText(editor);
    getCommandRun(excalidrawFeature, "excalidraw")(editor);
    await flushEditorUpdates();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      strictEqual(root.getChildrenSize(), 2);
      const drawingNode = root.getFirstChildOrThrow();
      strictEqual(drawingNode.getType(), "excalidraw");

      const selection = $getSelection();
      strictEqual($isRangeSelection(selection), true);
      if ($isRangeSelection(selection)) {
        const topLevel = selection.anchor.getNode().getTopLevelElement();
        strictEqual(topLevel?.getType(), "paragraph");
      }
    });
  });
});
