import {
  $createLinkNode,
  $isAutoLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { $patchStyleText } from "@lexical/selection";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
} from "lexical";
import {
  isValidEditorLinkUrl,
  normalizeEditorLinkUrl,
} from "../link-behavior/utils";
import {
  getFloatingToolbarSelectedNode,
  getSelectedLinkNode,
} from "./selection";

export const submitToolbarLink = (
  editor: LexicalEditor,
  linkUrl: string
): string => {
  const normalizedLinkUrl = normalizeEditorLinkUrl(linkUrl);

  if (isValidEditorLinkUrl(normalizedLinkUrl)) {
    editor.update(() => {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedLinkUrl);

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      const selectedNode = getFloatingToolbarSelectedNode(selection);
      const linkNode = getSelectedLinkNode(selectedNode);
      if (!$isAutoLinkNode(linkNode)) {
        return;
      }

      const replacementLinkNode = $createLinkNode(linkNode.getURL(), {
        rel: linkNode.__rel,
        target: linkNode.__target,
        title: linkNode.__title,
      });
      linkNode.replace(replacementLinkNode, true);
    });
  } else {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }

  return "";
};

export const clearToolbarLink = (editor: LexicalEditor) => {
  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
};

export const toggleToolbarFormat = (
  editor: LexicalEditor,
  format:
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "code"
    | "highlight"
) => {
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
};

/**
 * Applies an inline `color` CSS property to the current Lexical selection.
 * Passing an empty string removes the property from all selected text nodes.
 */
export const applyTextColor = (editor: LexicalEditor, color: string) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) {
      $patchStyleText(selection, { color: color || null });
    }
  });
};

/**
 * Applies an inline `background-color` CSS property to the current Lexical
 * selection.  Passing an empty string removes the property.
 */
export const applyBgColor = (editor: LexicalEditor, color: string) => {
  editor.update(() => {
    const selection = $getSelection();
    if (selection !== null) {
      $patchStyleText(selection, { "background-color": color || null });
    }
  });
};
