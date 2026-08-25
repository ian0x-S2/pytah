import type { ExtraEditorFeature } from "../../core/types";
import { DraggableBlockPlugin } from "./plugin";

/**
 * Installs the drag-handle block controls. The plugin self-gates on editor
 * editability, so mounting it in read-only mode is a no-op. Ships as the
 * `editor-draggable-blocks` registry item.
 */
export const draggableBlocksFeature: ExtraEditorFeature = {
  id: "draggable-blocks",
  plugin: DraggableBlockPlugin,
};
