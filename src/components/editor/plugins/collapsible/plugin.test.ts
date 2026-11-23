import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

import { createEditorConfig } from "../../core/config";
import {
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from "../../core/nodes/collapsible/container-node";
import {
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from "../../core/nodes/collapsible/content-node";
import {
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
} from "../../core/nodes/collapsible/title-node";
import { insertCollapsible } from "./utils";

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [
      CollapsibleContainerNode,
      CollapsibleTitleNode,
      CollapsibleContentNode,
    ],
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

describe("collapsible utils", () => {
  test("inserts a valid container/title/content structure at root", async () => {
    const editor = createTestEditor();

    await editor.update(() => {
      const inserted = insertCollapsible();
      strictEqual(inserted, true);
    });

    editor.getEditorState().read(() => {
      const container = $getRoot().getFirstChild();
      strictEqual($isCollapsibleContainerNode(container), true);
      if ($isCollapsibleContainerNode(container)) {
        strictEqual(container.getOpen(), true);
        strictEqual($isCollapsibleTitleNode(container.getFirstChild()), true);
        strictEqual($isCollapsibleContentNode(container.getLastChild()), true);
      }
    });
  });

  test("replaces a targeted paragraph cleanly without throwing when selection is at root", async () => {
    const editor = createTestEditor();
    let targetKey = "";

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("Replace me"));
      root.append(paragraph);
      targetKey = paragraph.getKey();
    });

    await editor.update(() => {
      const replaced = insertCollapsible(targetKey);
      strictEqual(replaced, true);
    });

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual(children.length, 1);
      strictEqual($isCollapsibleContainerNode(children[0]), true);
    });
  });
});
