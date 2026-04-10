import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { ParagraphNode } from "lexical";
import { createEditorConfig, DEFAULT_EDITOR_NODES } from "./config";

describe("editor config", () => {
  test("builds config with defaults", () => {
    const config = createEditorConfig({ editable: true });

    strictEqual(config.editable, true);
    strictEqual(config.namespace, "PytahEditor");
    deepStrictEqual(config.nodes, DEFAULT_EDITOR_NODES);
    strictEqual(typeof config.onError, "function");
  });

  test("appends extra nodes without dropping built-ins", () => {
    const config = createEditorConfig({
      editable: false,
      namespace: "CustomEditor",
      nodes: [ParagraphNode],
    });

    strictEqual(config.editable, false);
    strictEqual(config.namespace, "CustomEditor");
    strictEqual(config.nodes?.length, DEFAULT_EDITOR_NODES.length + 1);
    strictEqual(config.nodes?.at(-1), ParagraphNode);
  });
});
