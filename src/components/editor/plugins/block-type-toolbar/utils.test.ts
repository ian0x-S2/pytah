import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

import { createEditorConfig } from "../../core/config";
import { $createCalloutNode, CalloutNode } from "../../core/nodes/callout/node";
import {
  applyBlockType,
  getBlockTypeFromSelection,
  getElementFormatFromSelection,
} from "./utils";

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [CalloutNode],
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

describe("block-type-toolbar utils", () => {
  test("reads paragraph, h1-h6, callout variants, and alignment without throwing on root", async () => {
    const editor = createTestEditor();

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.setFormat("center");
      paragraph.append($createTextNode("Centered"));
      root.append(paragraph);
      root.select(0, 0);
    });

    editor.getEditorState().read(() => {
      strictEqual(getBlockTypeFromSelection(), null);
      strictEqual(getElementFormatFromSelection(), "");
    });

    await editor.update(() => {
      $getRoot().getFirstChild()?.selectStart();
    });

    editor.getEditorState().read(() => {
      strictEqual(getBlockTypeFromSelection(), "paragraph");
      strictEqual(getElementFormatFromSelection(), "center");
    });

    await editor.update(() => {
      const root = $getRoot();
      root.clear();
      const h4 = $createHeadingNode("h4");
      const text = $createTextNode("Deep heading");
      h4.append(text);
      root.append(h4);
      text.select(0, 0);
    });

    editor.getEditorState().read(() => {
      strictEqual(getBlockTypeFromSelection(), "h3");
    });

    await editor.update(() => {
      const root = $getRoot();
      root.clear();
      const callout = $createCalloutNode("warning");
      const p = $createParagraphNode();
      const text = $createTextNode("Heads up");
      p.append(text);
      callout.append(p);
      root.append(callout);
      text.select(0, 0);
    });

    editor.getEditorState().read(() => {
      strictEqual(getBlockTypeFromSelection(), "warning");
    });
  });

  test("applyBlockType converts paragraphs to headings and invokes custom command runners", async () => {
    const editor = createTestEditor();

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode("Heading candidate");
      paragraph.append(text);
      root.append(paragraph);
      text.select(0, 0);
    });

    applyBlockType(editor, "h2");
    await editor.update(() => {
      // flush update
    });

    editor.getEditorState().read(() => {
      strictEqual(getBlockTypeFromSelection(), "h2");
    });

    let customRan = false;
    applyBlockType(editor, "custom-block", () => {
      customRan = true;
    });
    strictEqual(customRan, true);
  });
});
