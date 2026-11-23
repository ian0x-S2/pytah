import { $isAutoLinkNode, $isLinkNode } from "@lexical/link";
import { $isLineBreakNode } from "lexical";
import type { LexicalNode, RangeSelection } from "lexical";

export const getFloatingToolbarSelectedNode = (selection: RangeSelection) => {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  if (anchorNode === focusNode) {
    return anchorNode;
  }

  return selection.isBackward() ? anchorNode : focusNode;
};

export const getSelectedLinkNode = (node: LexicalNode) => {
  const parent = node.getParent();

  if ($isLinkNode(parent) || $isAutoLinkNode(parent)) {
    return parent;
  }

  if ($isLinkNode(node) || $isAutoLinkNode(node)) {
    return node;
  }

  return null;
};

export const isSelectionWithinSingleLink = (selection: RangeSelection) => {
  const focusNode = getFloatingToolbarSelectedNode(selection);
  const focusLinkNode = getSelectedLinkNode(focusNode);

  if (!focusLinkNode) {
    return false;
  }

  const invalidNode = selection
    .getNodes()
    .filter((node) => !$isLineBreakNode(node))
    .find((node) => {
      const linkNode = getSelectedLinkNode(node);

      if (focusLinkNode && !focusLinkNode.is(linkNode)) {
        return true;
      }

      return $isAutoLinkNode(linkNode) && linkNode.getIsUnlinked();
    });

  return invalidNode === undefined;
};
