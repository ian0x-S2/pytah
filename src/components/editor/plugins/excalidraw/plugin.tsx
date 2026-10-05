"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";

import { ExcalidrawNode } from "../../core/nodes/excalidraw/node";
import { INSERT_EXCALIDRAW_COMMAND } from "./commands";
import { $insertExcalidrawBlock, handleExcalidrawPaste } from "./paste";

/**
 * Mounts the excalidraw insert behavior. Dispatching
 * `INSERT_EXCALIDRAW_COMMAND` inserts an empty drawing block whose editing
 * surface opens immediately; slash commands and toolbar inserts share this
 * single path.
 *
 * Pasting a drawing copied from an excalidraw canvas (its clipboard carries
 * `{"type":"excalidraw/clipboard",…}` in `text/plain`) inserts a drawing
 * block instead of dumping the raw JSON into the document as text.
 */
export function ExcalidrawPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ExcalidrawNode])) {
      throw new Error(
        "ExcalidrawPlugin: ExcalidrawNode is not registered on the editor"
      );
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_EXCALIDRAW_COMMAND,
        () => {
          editor.update(() => {
            $insertExcalidrawBlock("[]");
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent | null) => {
          if (!event) {
            return false;
          }
          return handleExcalidrawPaste(editor, event);
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor]);

  return null;
}
