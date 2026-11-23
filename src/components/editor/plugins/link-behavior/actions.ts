import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
} from "lexical";
import type { LexicalEditor } from "lexical";

import {
  getFloatingToolbarSelectedNode,
  getSelectedLinkNode,
} from "./selection";
import { isValidEditorLinkUrl, normalizeEditorLinkUrl } from "./utils";

const $replaceAutoLinkWithLink = (
  linkNode: ReturnType<typeof getSelectedLinkNode>
) => {
  if (!$isAutoLinkNode(linkNode)) {
    return linkNode;
  }

  const replacementLinkNode = $createLinkNode(linkNode.getURL(), {
    rel: linkNode.__rel,
    target: linkNode.__target,
    title: linkNode.__title,
  });
  linkNode.replace(replacementLinkNode, true);
  return replacementLinkNode;
};

const $replaceLinkDisplayText = (
  linkNode: ReturnType<typeof getSelectedLinkNode>,
  linkText: string
) => {
  if (!($isLinkNode(linkNode) || $isAutoLinkNode(linkNode))) {
    return;
  }

  if (!linkText || linkText === linkNode.getTextContent()) {
    return;
  }

  // Splice-replace the children in one step: inserting the replacement
  // before removing the old ones keeps the selection anchored to a live
  // node. `clear()` + `append()` removes the selected child first, which
  // trips Lexical's lost-selection repair and silently rolls the whole
  // update back — the edited title never reaches the editor.
  const firstChild = linkNode.getFirstChild();
  const textNode = $createTextNode(linkText);
  if ($isTextNode(firstChild)) {
    textNode.setFormat(firstChild.getFormat());
    textNode.setStyle(firstChild.getStyle());
  }
  linkNode.splice(0, linkNode.getChildrenSize(), [textNode]);
  textNode.select();
};

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
      $replaceAutoLinkWithLink(linkNode);
    });
  } else {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }

  return "";
};

export const clearToolbarLink = (editor: LexicalEditor) => {
  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
};

/**
 * Replaces the selected link's display text, keeping the caret inside the
 * link. An empty value is a no-op (the existing text is kept) so clearing
 * the field by accident never wipes the label.
 */
export const submitToolbarLinkText = (
  editor: LexicalEditor,
  linkText: string
) => {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    const selectedNode = getFloatingToolbarSelectedNode(selection);
    const linkNode = getSelectedLinkNode(selectedNode);
    $replaceLinkDisplayText(linkNode, linkText);
  });
};

/**
 * Applies the card's URL + text drafts in a single Lexical update (one undo
 * entry) and moves the caret just after the link. Returns `false` without
 * modifying the document if the URL is invalid so callers can show inline
 * validation feedback instead of silently removing the link.
 */
export const applyToolbarLink = (
  editor: LexicalEditor,
  linkUrl: string,
  linkText: string
): boolean => {
  const normalizedLinkUrl = normalizeEditorLinkUrl(linkUrl);
  if (!isValidEditorLinkUrl(normalizedLinkUrl)) {
    return false;
  }

  editor.update(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedLinkUrl);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    const selectedNode = getFloatingToolbarSelectedNode(selection);
    const activeLinkNode = $replaceAutoLinkWithLink(
      getSelectedLinkNode(selectedNode)
    );

    $replaceLinkDisplayText(activeLinkNode, linkText);
    activeLinkNode?.selectNext();
  });

  return true;
};
