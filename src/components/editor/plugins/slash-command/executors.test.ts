import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { createHeadlessEditor } from "@lexical/headless";
import {
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  type LexicalNode,
} from "lexical";
import { createEditorConfig } from "../../core/config";
import { createEmptyEditorState } from "../../core/utils";
import { DEFAULT_LAYOUT_TEMPLATE } from "../layout/constants";
import { SLASH_COMMAND_EXECUTORS } from "./executors";

const createTestEditor = () => {
  const config = createEditorConfig({ editable: true });

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

describe("slash command executors", () => {
  test("creates a default 3-column table structure", async () => {
    const editor = createTestEditor();
    await initializeEditor(editor);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      SLASH_COMMAND_EXECUTORS.table(paragraph);
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
    const editor = createTestEditor();
    await initializeEditor(editor);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      SLASH_COMMAND_EXECUTORS.columns(paragraph);
    });

    await flushEditorUpdates();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const layoutContainer = expectElementNode(root.getFirstChildOrThrow());

      strictEqual(layoutContainer.getType(), "layout-container");
      strictEqual(layoutContainer.getChildrenSize(), 2);
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
    const editor = createTestEditor();
    await initializeEditor(editor);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChildOrThrow();

      if (!$isParagraphNode(paragraph)) {
        throw new Error("Expected initial paragraph node");
      }

      SLASH_COMMAND_EXECUTORS.collapsible(paragraph);
    });

    await flushEditorUpdates();

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
});
