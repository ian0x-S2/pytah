import { $createParagraphNode, type ElementNode } from "lexical";
import { PencilRulerIcon } from "lucide-react";
import {
  $createExcalidrawNode,
  ExcalidrawNode,
} from "../../core/nodes/excalidraw/node";
import type { ExtraEditorFeature } from "../../core/types";
import { replaceCurrentBlock } from "../slash-command/utils";
import { ExcalidrawPlugin } from "./plugin";

// Replacing the selected paragraph leaves the selection dangling, which rolls
// the whole update back — re-anchor it on a trailing paragraph. The empty
// drawing block opens its editing surface as soon as it renders; discarding
// removes the node and keeps the paragraph.
const applyExcalidrawCommand = (targetElement: ElementNode): void => {
  const excalidrawNode = $createExcalidrawNode();
  const paragraph = $createParagraphNode();

  targetElement.replace(excalidrawNode);
  excalidrawNode.insertAfter(paragraph);
  paragraph.select();
};

/**
 * Installs the drawing feature: the `ExcalidrawNode`, its editing surface and
 * the shared insert-menu entry. Ships as the `editor-excalidraw` registry
 * item and pulls `@excalidraw/excalidraw`.
 */
export const excalidrawFeature: ExtraEditorFeature = {
  id: "excalidraw",
  nodes: [ExcalidrawNode],
  plugin: ExcalidrawPlugin,
  slashCommands: [
    {
      command: {
        description: "Draw a diagram or sketch",
        icon: PencilRulerIcon,
        id: "excalidraw",
        keywords: ["drawing", "diagram", "sketch", "whiteboard", "canvas"],
        label: "Drawing",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyExcalidrawCommand);
      },
    },
  ],
};
