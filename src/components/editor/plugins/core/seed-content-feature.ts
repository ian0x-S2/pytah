import type { ExtraEditorFeature } from "../../core/types";
import { SeedContentPlugin } from "./seed-content";

/**
 * Seeds the example document when the editor mounts empty. Intended for
 * demos; real consumers usually pass `initialMarkdown` or their own content
 * instead. Ships as the `editor-seed-content` registry item.
 */
export const seedContentFeature: ExtraEditorFeature = {
  id: "seed-content",
  plugin: SeedContentPlugin,
};
