import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import { $getRoot, $isParagraphNode } from "lexical";

import { createEditorConfig } from "../../core/config";
import {
  $isLayoutContainerNode,
  LayoutContainerNode,
} from "../../core/nodes/layout/container-node";
import {
  $isLayoutItemNode,
  LayoutItemNode,
} from "../../core/nodes/layout/item-node";
import {
  createLayoutContainer,
  getLayoutColumnCount,
  insertLayoutPreset,
} from "./utils";

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [LayoutContainerNode, LayoutItemNode],
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

describe("layout utils", () => {
  test("counts columns for explicit tracks and CSS repeat() expressions", () => {
    strictEqual(getLayoutColumnCount("1fr 1fr"), 2);
    strictEqual(getLayoutColumnCount("1fr 2fr 1fr"), 3);
    strictEqual(getLayoutColumnCount("repeat(3, 1fr)"), 3);
    strictEqual(getLayoutColumnCount("repeat(2, minmax(0, 1fr)) 200px"), 3);
    strictEqual(getLayoutColumnCount("   "), 1);
  });

  test("creates the expected number of LayoutItemNode children for repeat presets", async () => {
    const editor = createTestEditor();

    await editor.update(() => {
      const { layoutContainer } = createLayoutContainer("repeat(3, 1fr)");
      $getRoot().append(layoutContainer);
    });

    editor.getEditorState().read(() => {
      const container = $getRoot().getFirstChild();
      strictEqual($isLayoutContainerNode(container), true);
      if ($isLayoutContainerNode(container)) {
        const items = container.getChildren();
        strictEqual(items.length, 3);
        for (const item of items) {
          strictEqual($isLayoutItemNode(item), true);
        }
      }
    });
  });

  test("insertLayoutPreset appends a trailing paragraph after the container", async () => {
    const editor = createTestEditor();

    await editor.update(() => {
      insertLayoutPreset("1fr 1fr");
    });

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual($isLayoutContainerNode(children[0]), true);
      strictEqual($isParagraphNode(children.at(-1)), true);
    });
  });
});
