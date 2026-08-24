import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { createHeadlessEditor } from "@lexical/headless";
import { DEFAULT_EDITOR_FEATURES } from "../../composition";
import { createEditorConfig } from "../../config";
import { resolveFeatureNodes } from "../../features";
import {
  $createExcalidrawNode,
  $isExcalidrawNode,
  ExcalidrawNode,
  type SerializedExcalidrawNode,
} from "./node";

const SCENE_JSON = JSON.stringify({
  appState: { viewBackgroundColor: "#ffffff" },
  elements: [{ id: "el-1", isDeleted: false, type: "rectangle" }],
  files: {},
});

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: resolveFeatureNodes(DEFAULT_EDITOR_FEATURES),
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

describe("ExcalidrawNode", () => {
  test("creates an empty node by default", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createExcalidrawNode();
      strictEqual($isExcalidrawNode(node), true);
      strictEqual(node.getType(), "excalidraw");
      strictEqual(node.getData(), "[]");
      strictEqual(node.getWidth(), "inherit");
      strictEqual(node.getHeight(), "inherit");
      strictEqual(node.isInline(), false);
    });
  });

  test("serializes to JSON correctly", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createExcalidrawNode({
        data: SCENE_JSON,
        height: 240,
        width: 320,
      });
      deepStrictEqual(node.exportJSON(), {
        data: SCENE_JSON,
        height: 240,
        type: "excalidraw",
        version: 1,
        width: 320,
      });
    });
  });

  test("omits inherit dimensions when serializing", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createExcalidrawNode();
      deepStrictEqual(node.exportJSON(), {
        data: "[]",
        height: undefined,
        type: "excalidraw",
        version: 1,
        width: undefined,
      });
    });
  });

  test("deserializes from JSON correctly", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const serialized: SerializedExcalidrawNode = {
        data: SCENE_JSON,
        height: 120,
        type: "excalidraw",
        version: 1,
        width: 200,
      };
      const node = ExcalidrawNode.importJSON(serialized);
      strictEqual(node.getData(), SCENE_JSON);
      strictEqual(node.getWidth(), 200);
      strictEqual(node.getHeight(), 120);
    });
  });

  test("clones node state accurately", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createExcalidrawNode({ data: SCENE_JSON });
      const clone = ExcalidrawNode.clone(node);
      strictEqual(clone.getData(), SCENE_JSON);
    });
  });

  test("updates data and dimension setters", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createExcalidrawNode();
      node.setData(SCENE_JSON).setWidth(480).setHeight(360);
      strictEqual(node.getData(), SCENE_JSON);
      strictEqual(node.getWidth(), 480);
      strictEqual(node.getHeight(), 360);
    });
  });

  test("round-trips export/import without losing the scene", () => {
    const editor = createTestEditor();
    editor.update(() => {
      const node = $createExcalidrawNode({ data: SCENE_JSON, width: 640 });
      const restored = ExcalidrawNode.importJSON(
        node.exportJSON() as SerializedExcalidrawNode
      );
      strictEqual(restored.getData(), SCENE_JSON);
      strictEqual(restored.getWidth(), 640);
      strictEqual(restored.getHeight(), "inherit");
    });
  });
});
