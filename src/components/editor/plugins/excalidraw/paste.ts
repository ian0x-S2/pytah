"use client";

import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import type { LexicalEditor } from "lexical";

import { $createExcalidrawNode } from "../../core/nodes/excalidraw/node";
import { parseExcalidrawClipboard, serializeExcalidrawScene } from "./scene";

/**
 * Inserts an excalidraw block carrying `data` and re-anchors the selection on
 * a trailing paragraph so the update never commits with a dangling selection.
 * Must run inside `editor.update()`.
 */
export const $insertExcalidrawBlock = (data: string): void => {
  const excalidrawNode = $createExcalidrawNode({ data });
  $insertNodeToNearestRoot(excalidrawNode);

  const paragraph = $createParagraphNode();
  excalidrawNode.insertAfter(paragraph);
  paragraph.select();
};

/**
 * Handles a paste whose `text/plain` payload is an excalidraw clipboard
 * (`{"type":"excalidraw/clipboard","elements":[…]}`). Copying a drawing from
 * an excalidraw canvas writes that JSON to the system clipboard; without this
 * handler the editor dumps the raw JSON into the document as plain text.
 *
 * Returns true when the paste was consumed as a drawing (the caller's command
 * handler then stops propagation); false lets regular pastes fall through.
 */
export const handleExcalidrawPaste = (
  editor: LexicalEditor,
  event: ClipboardEvent
): boolean => {
  if (!$isRangeSelection($getSelection())) {
    return false;
  }

  const clipboardText = event.clipboardData?.getData("text/plain");
  if (!clipboardText) {
    return false;
  }

  const scene = parseExcalidrawClipboard(clipboardText);
  if (!scene) {
    return false;
  }

  event.preventDefault();
  editor.update(() => {
    $insertExcalidrawBlock(
      serializeExcalidrawScene(
        scene.elements,
        scene.appState ?? {},
        scene.files ?? {}
      )
    );
  });
  return true;
};
