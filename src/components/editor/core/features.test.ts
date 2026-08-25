import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import type { Transformer } from "@lexical/markdown";
import { collapsibleFeature } from "../plugins/collapsible/feature";
import { seedContentFeature } from "../plugins/core/seed-content-feature";
import { draggableBlocksFeature } from "../plugins/draggable-block/feature";
import { excalidrawFeature } from "../plugins/excalidraw/feature";
import { imageFeature } from "../plugins/image/feature";
import { layoutFeature } from "../plugins/layout/feature";
import { mathFeature } from "../plugins/math/feature";
import { tableFeature } from "../plugins/table-behavior/feature";
import { tocFeature } from "../plugins/toc/feature";
import { youtubeFeature } from "../plugins/youtube/feature";
import { DEFAULT_EDITOR_FEATURES } from "./composition";
import {
  computeEditorTransformers,
  computeFeatureNodes,
  computeResolvedSlashCommands,
  EDITOR_FEATURES,
} from "./features";
import { ImageNode } from "./nodes/image/node";
import { MathNode } from "./nodes/math/node";
import type { ExtraEditorFeature } from "./types";

const ALL_FEATURE_DESCRIPTORS: readonly ExtraEditorFeature[] = [
  collapsibleFeature,
  draggableBlocksFeature,
  excalidrawFeature,
  imageFeature,
  layoutFeature,
  mathFeature,
  seedContentFeature,
  tableFeature,
  tocFeature,
  youtubeFeature,
];

const KNOWN_SLASH_COMMAND_IDS = new Set([
  "paragraph",
  "h1",
  "h2",
  "h3",
  "quote",
  "code",
  "bullet",
  "number",
  "check",
  "math",
  "image",
  "youtube",
  "excalidraw",
  "collapsible",
  "columns",
  "table",
  "hr",
]);

describe("editor feature registry", () => {
  test("every core feature flag is present in defaults", () => {
    for (const feature of EDITOR_FEATURES) {
      strictEqual(
        feature.flag in DEFAULT_EDITOR_FEATURES,
        true,
        `missing default for flag: ${feature.flag}`
      );
    }
  });

  test("collects node registrations from extras only", () => {
    const nodes = computeFeatureNodes([imageFeature]);
    deepStrictEqual(nodes, [ImageNode]);

    const multiple = computeFeatureNodes([imageFeature, mathFeature]);
    deepStrictEqual(multiple, [ImageNode, MathNode]);

    deepStrictEqual(computeFeatureNodes(), []);
  });

  test("resolves the builtin transformer set plus extras", () => {
    const fakeTransformer: Transformer = { type: "element" } as Transformer;
    const transformers = computeEditorTransformers([
      { id: "fake", transformers: [fakeTransformer] },
    ]);

    strictEqual(transformers.includes(fakeTransformer), true);
    // The base set is always present.
    strictEqual(transformers.length > 5, true);
  });

  test("core slash commands are always resolved; extras append", () => {
    const baseCommands = computeResolvedSlashCommands();
    const baseIds = baseCommands.map((entry) => entry.command.id);

    strictEqual(baseIds.includes("table"), true);
    strictEqual(baseIds.includes("hr"), true);
    strictEqual(baseIds.includes("image"), false);
    strictEqual(baseIds.includes("youtube"), false);

    const withExtras = computeResolvedSlashCommands([
      imageFeature,
      youtubeFeature,
    ]);
    const withExtraIds = withExtras.map((entry) => entry.command.id);

    strictEqual(withExtraIds.includes("image"), true);
    strictEqual(withExtraIds.includes("youtube"), true);
  });

  test("feature descriptors have a valid shape", () => {
    const ids = new Set<string>();

    for (const descriptor of ALL_FEATURE_DESCRIPTORS) {
      strictEqual(typeof descriptor.id, "string");
      strictEqual(
        ids.has(descriptor.id),
        false,
        `duplicate id: ${descriptor.id}`
      );
      ids.add(descriptor.id);

      strictEqual(
        Boolean(descriptor.plugin || descriptor.nodes),
        true,
        `descriptor ${descriptor.id} contributes nothing`
      );

      for (const contribution of descriptor.slashCommands ?? []) {
        strictEqual(
          KNOWN_SLASH_COMMAND_IDS.has(contribution.command.id),
          true,
          `unknown slash command id: ${contribution.command.id}`
        );
        strictEqual(typeof contribution.run, "function");
      }
    }
  });
});
