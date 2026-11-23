import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

import { createEditorConfig } from "../../core/config";
import { resolveSelectedHeadingKey } from "./utils";

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [],
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

describe("toc utils", () => {
  test("resolveSelectedHeadingKey returns the heading key when selection is inside a heading", async () => {
    const editor = createTestEditor();
    let headingKey = "";

    await editor.update(() => {
      const heading = $createHeadingNode("h2");
      const text = $createTextNode("Section heading");
      heading.append(text);
      $getRoot().append(heading);
      text.select(0, 0);
      headingKey = heading.getKey();
    });

    const resolved = editor
      .getEditorState()
      .read(() => resolveSelectedHeadingKey());
    strictEqual(resolved, headingKey);
  });

  test("resolveSelectedHeadingKey returns null cleanly when selection is on root or paragraph", async () => {
    const editor = createTestEditor();

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("Plain paragraph"));
      root.append(paragraph);
      root.select(0, 0);
    });

    const onRoot = editor
      .getEditorState()
      .read(() => resolveSelectedHeadingKey());
    strictEqual(onRoot, null);

    await editor.update(() => {
      $getRoot().getFirstChild()?.selectStart();
    });

    const onParagraph = editor
      .getEditorState()
      .read(() => resolveSelectedHeadingKey());
    strictEqual(onParagraph, null);
  });
});
