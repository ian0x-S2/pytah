import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import { $convertFromMarkdownString } from "@lexical/markdown";
import type {
  MultilineElementTransformer,
  TextMatchTransformer,
} from "@lexical/markdown";
import { $getRoot } from "lexical";

import { createEditorConfig } from "../../core/config";
import {
  $createMathNode,
  $isMathNode,
  MathNode,
} from "../../core/nodes/math/node";
import {
  MATH_BLOCK_MARKDOWN_TRANSFORMER,
  MATH_INLINE_MARKDOWN_TRANSFORMER,
} from "../../core/nodes/math/transformers";

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [MathNode],
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

describe("Math Plugin and Transformers", () => {
  test("exports inline math to markdown", () => {
    const editor = createTestEditor();
    const inlineTransformer: TextMatchTransformer | undefined =
      MATH_INLINE_MARKDOWN_TRANSFORMER;
    strictEqual(Boolean(inlineTransformer), true);

    const exportFn = inlineTransformer?.export;
    if (exportFn) {
      editor.update(() => {
        const node = $createMathNode({ equation: "e = mc^2", inline: true });
        const result = exportFn(
          node,
          () => "",
          () => ""
        );
        strictEqual(result, "$e = mc^2$");
      });
    }
  });

  test("exports block math to markdown", () => {
    const editor = createTestEditor();
    const blockTransformer: MultilineElementTransformer | undefined =
      MATH_BLOCK_MARKDOWN_TRANSFORMER;
    strictEqual(Boolean(blockTransformer), true);

    const exportFn = blockTransformer?.export;
    if (exportFn) {
      editor.update(() => {
        const node = $createMathNode({ equation: "\\int x dx", inline: false });
        const result = exportFn(node, () => "");
        strictEqual(result, "$$\n\\int x dx\n$$");
      });
    }
  });

  test("imports single-line and multiline block math, and ignores unclosed $$", async () => {
    const editor = createTestEditor();
    const transformers = [
      MATH_BLOCK_MARKDOWN_TRANSFORMER,
      MATH_INLINE_MARKDOWN_TRANSFORMER,
    ];

    await editor.update(() => {
      $convertFromMarkdownString("$$x^2 + y^2 = z^2$$", transformers);
    });
    editor.getEditorState().read(() => {
      const first = $getRoot().getFirstChild();
      strictEqual($isMathNode(first), true);
      if ($isMathNode(first)) {
        strictEqual(first.getEquation(), "x^2 + y^2 = z^2");
        strictEqual(first.getInline(), false);
      }
    });

    await editor.update(() => {
      $convertFromMarkdownString("$$\nnot closed\nstill text", transformers);
    });
    editor.getEditorState().read(() => {
      const hasMath = $getRoot()
        .getChildren()
        .some((child) => $isMathNode(child));
      strictEqual(hasMath, false);
    });
  });

  test("parses inline math while leaving currency values untouched", async () => {
    const editor = createTestEditor();
    const transformers = [MATH_INLINE_MARKDOWN_TRANSFORMER];

    await editor.update(() => {
      $convertFromMarkdownString("Items cost $5 and $10 total.", transformers);
    });
    editor.getEditorState().read(() => {
      const descendants = $getRoot().getAllTextNodes();
      const text = descendants.map((n) => n.getTextContent()).join("");
      strictEqual(text, "Items cost $5 and $10 total.");
    });

    await editor.update(() => {
      $convertFromMarkdownString("Formula $a + b = c$ works.", transformers);
    });
    editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChild();
      const hasMath =
        paragraph !== null &&
        "getChildren" in paragraph &&
        typeof paragraph.getChildren === "function" &&
        (paragraph.getChildren() as unknown[]).some((child) =>
          $isMathNode(child as never)
        );
      strictEqual(hasMath, true);
    });
  });
});
