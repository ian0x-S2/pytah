import type { ExtraEditorFeature } from "../../core/types";
import { TocFeaturePlugin } from "./feature";

/**
 * Installs the table-of-contents sidebar. Ships as the `editor-toc` registry
 * item.
 */
export const tocFeature: ExtraEditorFeature = {
  id: "toc",
  plugin: TocFeaturePlugin,
};
