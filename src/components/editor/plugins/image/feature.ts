import { ImageIcon } from "lucide-react";
import { ImageNode } from "../../core/nodes/image/node";
import { IMAGE_MARKDOWN_TRANSFORMER } from "../../core/nodes/image/transformer";
import type { ExtraEditorFeature } from "../../core/types";
import { INSERT_IMAGE_COMMAND } from "./commands";
import { ImagePlugin } from "./plugin";

/**
 * Installs the image feature: the `ImageNode`, drag-drop/paste handling, the
 * markdown `![alt](src)` transformer and the shared insert-menu entry. Ships
 * as the `editor-image` registry item.
 */
export const imageFeature: ExtraEditorFeature = {
  id: "image",
  nodes: [ImageNode],
  plugin: ImagePlugin,
  slashCommands: [
    {
      command: {
        description: "Insert an image from URL",
        icon: ImageIcon,
        id: "image",
        keywords: ["image", "photo", "media", "picture", "img"],
        label: "Image",
      },
      run: (editor) => {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {});
      },
    },
  ],
  transformers: [IMAGE_MARKDOWN_TRANSFORMER],
};
