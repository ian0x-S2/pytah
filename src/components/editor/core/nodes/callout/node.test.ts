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
  KEY_ENTER_COMMAND,
  ParagraphNode,
  TextNode,
} = await import("lexical");
const { $createQuoteNode, QuoteNode } = await import("@lexical/rich-text");
const { registerMarkdownShortcuts } = await import("@lexical/markdown");

const { $createCalloutNode, $isCalloutNode, CalloutNode } =
  await import("./node");
const { CALLOUT_MARKDOWN_TRANSFORMER } = await import("./transformer");

describe("CalloutNode", () => {
  test("creates a CalloutNode instance with default type", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const node = $createCalloutNode();
      strictEqual($isCalloutNode(node), true);
      strictEqual(node.getCalloutType(), "note");
      strictEqual(node.getEmoji(), undefined);
    });
  });

  test("creates a CalloutNode instance with custom type and emoji", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const node = $createCalloutNode("warning", "⚠️");
      strictEqual(node.getCalloutType(), "warning");
      strictEqual(node.getEmoji(), "⚠️");
    });
  });

  test("updates calloutType and emoji via setters", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const node = $createCalloutNode("note");
      node.setCalloutType("tip");
      node.setEmoji("💡");
      strictEqual(node.getCalloutType(), "tip");
      strictEqual(node.getEmoji(), "💡");
    });
  });

  test("clones node state accurately", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const original = $createCalloutNode("caution", "🚨");
      const clone = CalloutNode.clone(original);
      strictEqual(clone.getCalloutType(), "caution");
      strictEqual(clone.getEmoji(), "🚨");
    });
  });

  test("serializes and deserializes JSON correctly", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const node = $createCalloutNode("tip", "✨");
      const json = node.exportJSON();
      strictEqual(json.type, "callout");
      strictEqual(json.calloutType, "tip");
      strictEqual(json.emoji, "✨");

      const imported = CalloutNode.importJSON(json);
      strictEqual($isCalloutNode(imported), true);
      strictEqual(imported.getCalloutType(), "tip");
      strictEqual(imported.getEmoji(), "✨");
    });
  });

  test("exports and imports DOM with data-callout-type", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const node = $createCalloutNode("warning");
      const { element } = node.exportDOM();
      strictEqual(element instanceof HTMLElement, true);
      if (element instanceof HTMLElement) {
        strictEqual(element.dataset.calloutType, "warning");
        strictEqual(element.classList.contains("editor-callout"), true);
        strictEqual(element.classList.contains("editor-callout-warning"), true);
      }
    });
  });

  test("exports callout to GitHub Alert markdown", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const node = $createCalloutNode("tip");
      const exported = CALLOUT_MARKDOWN_TRANSFORMER.export?.(
        node,
        () => "Tip text goes here"
      );
      strictEqual(exported, "> [!TIP]\n> Tip text goes here");
    });
  });

  test("imports callout from GitHub Alert markdown lines", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const root = $getRoot();
      const lines = [
        "> [!WARNING]",
        "> Critical note line 1",
        "> Critical note line 2",
        "Normal line after",
      ];

      const startMatch = lines[0].match(
        CALLOUT_MARKDOWN_TRANSFORMER.regExpStart
      );
      strictEqual(startMatch !== null, true);
      if (!startMatch) {
        return;
      }

      const result = CALLOUT_MARKDOWN_TRANSFORMER.handleImportAfterStartMatch?.(
        {
          lines,
          rootNode: root,
          startLineIndex: 0,
          startMatch,
          transformer: CALLOUT_MARKDOWN_TRANSFORMER,
        }
      );

      strictEqual(result !== null, true);
      strictEqual(result?.[0], true);
      strictEqual(result?.[1], 2);

      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "warning");
        strictEqual(
          firstChild.getTextContent().includes("Critical note line 1"),
          true
        );
      }
    });
  });

  test("imports callout with inline text on the initial alert line", () => {
    const editor = createEditor({
      nodes: [CalloutNode],
    });

    editor.update(() => {
      const root = $getRoot();
      const lines = [
        "> [!TIP] Inline tip text",
        "> Second tip line",
        "Trailing text",
      ];

      const startMatch = lines[0].match(
        CALLOUT_MARKDOWN_TRANSFORMER.regExpStart
      );
      strictEqual(startMatch !== null, true);
      if (!startMatch) {
        return;
      }

      const result = CALLOUT_MARKDOWN_TRANSFORMER.handleImportAfterStartMatch?.(
        {
          lines,
          rootNode: root,
          startLineIndex: 0,
          startMatch,
          transformer: CALLOUT_MARKDOWN_TRANSFORMER,
        }
      );

      strictEqual(result !== null, true);
      strictEqual(result?.[0], true);
      strictEqual(result?.[1], 1);

      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "tip");
        strictEqual(
          firstChild.getTextContent().includes("Inline tip text"),
          true
        );
        strictEqual(
          firstChild.getTextContent().includes("Second tip line"),
          true
        );
      }
    });
  });

  test("regExpStart matches alert variants with and without quote prefix", () => {
    const regex = CALLOUT_MARKDOWN_TRANSFORMER.regExpStart;

    const validSamples = [
      "> [!NOTE]",
      "> [!TIP]",
      "> [!INFO]",
      "> [!WARNING]",
      "> [!IMPORTANT]",
      "> [!CAUTION]",
      "> [!tip]",
      "> [!Tip]",
      ">[!NOTE]",
      "[!TIP]",
      "[!NOTE]",
      "> [!TIP] ",
      "[!WARNING] ",
    ];

    for (const sample of validSamples) {
      strictEqual(regex.test(sample), true, `Sample should match: "${sample}"`);
    }

    const invalidSamples = [
      "> [!INVALID]",
      "> regular quote line",
      "plain text without alert",
      "prefix > [!TIP]",
    ];

    for (const sample of invalidSamples) {
      strictEqual(
        regex.test(sample),
        false,
        `Sample should not match: "${sample}"`
      );
    }
  });

  test("replace converts ParagraphNode into CalloutNode with Paragraph child", () => {
    const editor = createEditor({
      nodes: [CalloutNode, ParagraphNode, TextNode],
    });

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const text = $createTextNode("> [!TIP]");
      paragraph.append(text);
      root.append(paragraph);

      const match = text
        .getTextContent()
        .match(CALLOUT_MARKDOWN_TRANSFORMER.regExpStart);
      strictEqual(match !== null, true);
      if (!match) {
        return;
      }

      CALLOUT_MARKDOWN_TRANSFORMER.replace(
        paragraph,
        [],
        match,
        null,
        null,
        false
      );

      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "tip");
        strictEqual(firstChild.getChildrenSize(), 1);
      }
    });
  });

  test("replace converts QuoteNode into CalloutNode with type and preserved children", () => {
    const editor = createEditor({
      nodes: [CalloutNode, ParagraphNode, TextNode, QuoteNode],
    });

    editor.update(() => {
      const root = $getRoot();
      const quote = $createQuoteNode();
      const text = $createTextNode("[!WARNING]");
      const trailing = $createTextNode(" Watch out!");
      quote.append(text);
      root.append(quote);

      const match = text
        .getTextContent()
        .match(CALLOUT_MARKDOWN_TRANSFORMER.regExpStart);
      strictEqual(match !== null, true);
      if (!match) {
        return;
      }

      CALLOUT_MARKDOWN_TRANSFORMER.replace(
        quote,
        [trailing],
        match,
        null,
        null,
        false
      );

      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "warning");
        strictEqual(firstChild.getTextContent(), " Watch out!");
      }
    });
  });

  test("triggers callout shortcut on Enter in ParagraphNode via registerMarkdownShortcuts", () => {
    const editor = createEditor({
      nodes: [CalloutNode, ParagraphNode, TextNode],
    });
    registerMarkdownShortcuts(editor, [CALLOUT_MARKDOWN_TRANSFORMER]);

    editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      const textNode = $createTextNode("> [!TIP]");
      paragraph.append(textNode);
      root.append(paragraph);
      textNode.select(
        textNode.getTextContentSize(),
        textNode.getTextContentSize()
      );
    });

    const handled = editor.dispatchCommand(KEY_ENTER_COMMAND, null);
    strictEqual(handled, true);

    editor.read(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "tip");
      }
    });
  });

  test("triggers callout shortcut on Enter in QuoteNode via registerMarkdownShortcuts", () => {
    const editor = createEditor({
      nodes: [CalloutNode, ParagraphNode, TextNode, QuoteNode],
    });
    registerMarkdownShortcuts(editor, [CALLOUT_MARKDOWN_TRANSFORMER]);

    editor.update(() => {
      const root = $getRoot();
      const quote = $createQuoteNode();
      const textNode = $createTextNode("[!NOTE]");
      quote.append(textNode);
      root.append(quote);
      textNode.select(
        textNode.getTextContentSize(),
        textNode.getTextContentSize()
      );
    });

    const handled = editor.dispatchCommand(KEY_ENTER_COMMAND, null);
    strictEqual(handled, true);

    editor.read(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      strictEqual($isCalloutNode(firstChild), true);
      if ($isCalloutNode(firstChild)) {
        strictEqual(firstChild.getCalloutType(), "note");
      }
    });
  });
});
