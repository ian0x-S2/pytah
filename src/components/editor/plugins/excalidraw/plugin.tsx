"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $createParagraphNode, COMMAND_PRIORITY_EDITOR } from "lexical";
import { useEffect } from "react";
import {
  $createExcalidrawNode,
  ExcalidrawNode,
} from "../../core/nodes/excalidraw/node";
import { INSERT_EXCALIDRAW_COMMAND } from "./commands";

/**
 * Mounts the excalidraw insert behavior. Dispatching
 * `INSERT_EXCALIDRAW_COMMAND` inserts an empty drawing block whose editing
 * surface opens immediately; slash commands and toolbar inserts share this
 * single path.
 */
export function ExcalidrawPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ExcalidrawNode])) {
      throw new Error(
        "ExcalidrawPlugin: ExcalidrawNode is not registered on the editor"
      );
    }

    return editor.registerCommand(
      INSERT_EXCALIDRAW_COMMAND,
      () => {
        editor.update(() => {
          const excalidrawNode = $createExcalidrawNode();
          $insertNodeToNearestRoot(excalidrawNode);

          // Re-anchor the selection on a trailing paragraph so the update
          // never commits with a dangling selection.
          const paragraph = $createParagraphNode();
          excalidrawNode.insertAfter(paragraph);
          paragraph.select();
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
