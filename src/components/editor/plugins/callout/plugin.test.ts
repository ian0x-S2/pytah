import { strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof window === "undefined") {
  GlobalRegistrator.register();
}

after(() => {
  if (typeof window !== "undefined") {
    GlobalRegistrator.unregister();
  }
});

const {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  ParagraphNode,
  TextNode,
} = await import("lexical");

const { $isCalloutNode, CalloutNode } =
  await import("../../core/nodes/callout/node");
const { insertCallout, replaceElementWithCallout } = await import("./utils");

describe("Callout Plugin & Utils", () => {
  test("inserts callout at root when no selection", () => {
    const editor = createEditor({
      nodes: [CalloutNode, ParagraphNode, TextNode],
    });

    editor.update(() => {
      insertCallout("tip");
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "tip");
      }
    });
  });

  test("replaces existing element with callout and preserves children", () => {
    const editor = createEditor({
      nodes: [CalloutNode, ParagraphNode, TextNode],
    });

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode("Important announcement");
      paragraph.append(text);
      root.append(paragraph);

      replaceElementWithCallout(paragraph, "warning");

      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "warning");
        strictEqual(firstChild.getTextContent(), "Important announcement");
      }
    });
  });
});
