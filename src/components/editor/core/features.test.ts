import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_EDITOR_FEATURES } from "./composition";
import {
  computeFeatureNodes,
  EDITOR_FEATURES,
  resolveFeatureNodes,
  resolveSlashCommandIds,
} from "./features";
import { ImageNode } from "./nodes/image/node";

describe("editor feature registry", () => {
  test("every feature flag is present in defaults", () => {
    for (const feature of EDITOR_FEATURES) {
      strictEqual(
        feature.flag in DEFAULT_EDITOR_FEATURES,
        true,
        `missing default for flag: ${feature.flag}`
      );
    }
  });

  test("resolves feature nodes only for enabled features", () => {
    const nodes = resolveFeatureNodes(DEFAULT_EDITOR_FEATURES);
    strictEqual(nodes.includes(ImageNode), true);

    const disabled = resolveFeatureNodes({
      ...DEFAULT_EDITOR_FEATURES,
      images: false,
    });
    strictEqual(disabled.includes(ImageNode), false);
  });

  test("resolves slash command ids only for enabled features", () => {
    const ids = resolveSlashCommandIds({
      ...DEFAULT_EDITOR_FEATURES,
      tables: false,
      youtube: false,
    });
    strictEqual(ids.includes("table"), false);
    strictEqual(ids.includes("youtube"), false);
    strictEqual(ids.includes("columns"), true);
  });

  test("appends consumer feature nodes without touching built-ins", () => {
    const nodes = computeFeatureNodes(DEFAULT_EDITOR_FEATURES, [
      { id: "callout", nodes: [ImageNode] },
    ]);
    deepStrictEqual(nodes, [
      ...resolveFeatureNodes(DEFAULT_EDITOR_FEATURES),
      ImageNode,
    ]);
  });
});
