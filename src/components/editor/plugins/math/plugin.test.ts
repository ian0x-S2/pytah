import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { createHeadlessEditor } from "@lexical/headless";
import type {
  MultilineElementTransformer,
  TextMatchTransformer,
} from "@lexical/markdown";
import { createEditorConfig } from "../../core/config";
import { $createMathNode, MathNode } from "../../core/nodes/math/node";
import { EDITOR_MARKDOWN_TRANSFORMERS } from "../markdown/transformers";

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

describe("Math Plugin and Transformers", () => {
  test("exports inline math to markdown", () => {
    const editor = createTestEditor();
    const inlineTransformer = EDITOR_MARKDOWN_TRANSFORMERS.find(
      (t): t is TextMatchTransformer => "trigger" in t && t.trigger === "$"
    );
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
    const blockTransformer = EDITOR_MARKDOWN_TRANSFORMERS.find(
      (t): t is MultilineElementTransformer =>
        "regExpStart" in t && t.dependencies.includes(MathNode)
    );
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
});
