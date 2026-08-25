import { collapsibleFeature } from "@/components/editor/plugins/collapsible/feature";
import { seedContentFeature } from "@/components/editor/plugins/core/seed-content-feature";
import { draggableBlocksFeature } from "@/components/editor/plugins/draggable-block/feature";
import { excalidrawFeature } from "@/components/editor/plugins/excalidraw/feature";
import { imageFeature } from "@/components/editor/plugins/image/feature";
import { layoutFeature } from "@/components/editor/plugins/layout/feature";
import { mathFeature } from "@/components/editor/plugins/math/feature";
import { tableFeature } from "@/components/editor/plugins/table-behavior/feature";
import { youtubeFeature } from "@/components/editor/plugins/youtube/feature";

/**
 * App-level composition for the demo surface: every optional feature the
 * registry ships, wired explicitly through `extraFeatures`. Consumers who
 * install individual registry items compose only the descriptors they
 * installed.
 */
export const demoEditorFeatures = [
  collapsibleFeature,
  seedContentFeature,
  draggableBlocksFeature,
  excalidrawFeature,
  imageFeature,
  layoutFeature,
  mathFeature,
  // The TOC is composed via `EditorWithToc`'s shell slot instead of the
  // `tocFeature` descriptor — mounting both would render two sidebars.
  tableFeature,
  youtubeFeature,
];
