import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { createHeadlessEditor } from "@lexical/headless";
import { createEditorConfig } from "../../config";
import { $createMathNode, $isMathNode, MathNode } from "./node";

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

describe("MathNode", () => {
  test("creates a MathNode instance with default inline state", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createMathNode({ equation: "e = mc^2" });
      strictEqual($isMathNode(node), true);
      strictEqual(node.getType(), "math");
      strictEqual(node.getEquation(), "e = mc^2");
      strictEqual(node.getInline(), true);
      strictEqual(node.isInline(), true);
    });
  });

  test("creates a MathNode instance with block display mode", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createMathNode({ equation: "\\frac{a}{b}", inline: false });
      strictEqual(node.getEquation(), "\\frac{a}{b}");
      strictEqual(node.getInline(), false);
      strictEqual(node.isInline(), false);
    });
  });

  test("serializes to JSON correctly", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createMathNode({
        equation: "a^2 + b^2 = c^2",
        inline: false,
      });
      const serialized = node.exportJSON();
      deepStrictEqual(serialized, {
        equation: "a^2 + b^2 = c^2",
        inline: false,
        type: "math",
        version: 1,
      });
    });
  });

  test("deserializes from JSON correctly", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = MathNode.importJSON({
        equation: "E = h\\nu",
        inline: true,
        type: "math",
        version: 1,
      });
      strictEqual(node.getEquation(), "E = h\\nu");
      strictEqual(node.getInline(), true);
    });
  });

  test("clones node state accurately", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createMathNode({ equation: "x + y = z", inline: true });
      const clone = MathNode.clone(node);
      strictEqual(clone.getEquation(), "x + y = z");
      strictEqual(clone.getInline(), true);
    });
  });

  test("updates equation and inline setters", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createMathNode({ equation: "1 + 1 = 2" });
      node.setEquation("2 + 2 = 4");
      strictEqual(node.getEquation(), "2 + 2 = 4");
      node.setInline(false);
      strictEqual(node.getInline(), false);
    });
  });
});
