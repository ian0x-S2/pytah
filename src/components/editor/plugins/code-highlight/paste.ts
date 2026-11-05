"use client";

import { $insertDataTransferForPlainText } from "@lexical/clipboard";
import { $isCodeNode } from "@lexical/code";
import { objectKlassEquals } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  PASTE_TAG,
} from "lexical";
import type { LexicalEditor, LexicalNode } from "lexical";

const $isInsideCodeBlock = (node: LexicalNode | null): boolean => {
  let current: LexicalNode | null = node;
  while (current !== null) {
    if ($isCodeNode(current)) {
      return true;
    }
    current = current.getParent();
  }
  return false;
};

const $isSelectionInCodeBlock = (): boolean => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  return (
    $isInsideCodeBlock(selection.anchor.getNode()) ||
    $isInsideCodeBlock(selection.focus.getNode())
  );
};

/**
 * Registers the code-block paste handler. Code blocks only hold plain text,
 * so any text paste that lands inside one is inserted verbatim — replacing the
 * current selection — instead of going through the rich-text clipboard path.
 *
 * That path is what broke select-all + paste: copying a code block (or any
 * HTML/rich payload) and pasting it over a full-block selection made Lexical
 * generate block nodes (paragraphs) and splice them into the `CodeNode`. The
 * splice silently no-ops, so the paste looked swallowed until the selection
 * was deleted first. Inserting the clipboard's plain text through
 * `$insertDataTransferForPlainText` keeps the replacement deterministic for
 * every clipboard flavor (plain text, HTML, Lexical JSON) and also prevents
 * pasted styling from leaking into code.
 */
export function registerCodePaste(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
      if (!objectKlassEquals(event, ClipboardEvent)) {
        return false;
      }
      const dataTransfer = event.clipboardData;
      if (!dataTransfer) {
        return false;
      }
      // Image/file pastes belong to the image feature, not the code block.
      if (dataTransfer.files.length > 0) {
        return false;
      }
      const text =
        dataTransfer.getData("text/plain") ||
        dataTransfer.getData("text/uri-list");
      if (!text || !$isSelectionInCodeBlock()) {
        return false;
      }
      event.preventDefault();
      editor.update(
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $insertDataTransferForPlainText(dataTransfer, selection);
          }
        },
        { tag: PASTE_TAG }
      );
      return true;
    },
    COMMAND_PRIORITY_HIGH
  );
}
