"use client";

import { $createLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
} from "lexical";
import type { LexicalEditor } from "lexical";

import type { FloatingLinkEditorAnchor } from "./floating-link-editor-position";
import { toFloatingLinkEditorAnchor } from "./floating-link-editor-position";
import {
  LINK_PLACEHOLDER_URL,
  isValidEditorLinkUrl,
  normalizeEditorLinkUrl,
} from "./utils";

export interface LinkPasteMenuPayload {
  anchor: FloatingLinkEditorAnchor | null;
  linkNodeKey: string;
  url: string;
}

export interface HandleLinkPasteOptions {
  onShowPasteMenu?: (payload: LinkPasteMenuPayload) => void;
}

/**
 * Handles paste events when text is selected or when a link is pasted alone.
 * - If text is selected, it wraps the selected text in a link.
 * - If selection is collapsed and `onShowPasteMenu` is provided, it inserts
 *   the link and triggers the Link Paste Menu (for weblink/bookmark cards).
 * - Otherwise falls through to standard paste.
 */
export const handleLinkPaste = (
  editor: LexicalEditor,
  event: ClipboardEvent,
  options?: HandleLinkPasteOptions
): boolean => {
  if (event.clipboardData?.files && event.clipboardData.files.length > 0) {
    return false;
  }

  const clipboardText = event.clipboardData?.getData("text/plain")?.trim();
  if (!clipboardText || /[\r\n]/u.test(clipboardText)) {
    return false;
  }

  if (
    clipboardText === LINK_PLACEHOLDER_URL ||
    !isValidEditorLinkUrl(clipboardText)
  ) {
    return false;
  }

  let hasSelectedText = false;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
      hasSelectedText = true;
    }
  });

  const normalizedUrl = normalizeEditorLinkUrl(clipboardText);

  if (hasSelectedText) {
    event.preventDefault();
    editor.update(() => {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedUrl);
    });
    return true;
  }

  if (!options?.onShowPasteMenu) {
    return false;
  }

  event.preventDefault();
  let linkKey = "";

  editor.update(
    () => {
      const linkNode = $createLinkNode(normalizedUrl);
      const textNode = $createTextNode(normalizedUrl);
      linkNode.append(textNode);
      $insertNodes([linkNode]);
      linkKey = linkNode.getKey();
    },
    {
      onUpdate: () => {
        const element = editor.getElementByKey(linkKey);
        const rect = element?.getBoundingClientRect();
        const anchor = rect ? toFloatingLinkEditorAnchor(rect) : null;
        options.onShowPasteMenu?.({
          anchor,
          linkNodeKey: linkKey,
          url: normalizedUrl,
        });
      },
    }
  );

  return true;
};
