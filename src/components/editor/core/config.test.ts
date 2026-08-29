import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { ParagraphNode } from "lexical";
import { BASE_EDITOR_NODES, createEditorConfig } from "./config";

describe("editor config", () => {
  test("builds config with base nodes when no features contribute", () => {
    const config = createEditorConfig({ editable: true });

    strictEqual(config.editable, true);
    strictEqual(config.namespace, "PytahEditor");
    deepStrictEqual(config.nodes, BASE_EDITOR_NODES);
    strictEqual(typeof config.onError, "function");
  });

  test("appends feature nodes then consumer nodes", () => {
    const config = createEditorConfig({
      editable: false,
      namespace: "CustomEditor",
      featureNodes: [ParagraphNode],
      extraNodes: [ParagraphNode],
    });

    strictEqual(config.editable, false);
    strictEqual(config.namespace, "CustomEditor");
    strictEqual(config.nodes?.length, BASE_EDITOR_NODES.length + 2);
    strictEqual(config.nodes?.at(-1), ParagraphNode);
  });

  test("passes through an initial-state builder when provided", () => {
    const seedEditorState = () => {
      // A real builder mutates the document; identity is what matters here.
    };
    const config = createEditorConfig({
      editable: true,
      editorState: seedEditorState,
    });

    strictEqual(config.editorState, seedEditorState);
  });

  test("omits the editorState key when no seed builder is provided", () => {
    const config = createEditorConfig({ editable: true });

    strictEqual("editorState" in config, false);
  });
});
