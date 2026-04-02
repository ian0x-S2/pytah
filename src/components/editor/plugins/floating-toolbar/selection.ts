import { $isCodeNode } from "@lexical/code";
import { $isAutoLinkNode, $isLinkNode } from "@lexical/link";
import {
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  type LexicalNode,
  type RangeSelection,
} from "lexical";
import { DEFAULT_FORMAT_STATE, EMPTY_TOOLBAR_POSITION } from "./constants";
import type {
  FloatingToolbarFormatState,
  FloatingToolbarPosition,
  FloatingToolbarState,
} from "./types";

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

const getToolbarPosition = (): FloatingToolbarPosition | null => {
  const nativeSelection = window.getSelection();
  if (!(nativeSelection && nativeSelection.rangeCount > 0)) {
    return null;
  }

  const range = nativeSelection.getRangeAt(0);
  const rectangle = range.getBoundingClientRect();

  if (rectangle.width === 0 && rectangle.height === 0) {
    return null;
  }

  return {
    left: rectangle.left + rectangle.width / 2,
    top: rectangle.top - 10,
  };
};

const getFormatState = (
  selection: RangeSelection,
  node: LexicalNode
): FloatingToolbarFormatState => {
  const linkNode = getSelectedLinkNode(node);

  return {
    isBold: selection.hasFormat("bold"),
    isCode: selection.hasFormat("code"),
    isHighlight: selection.hasFormat("highlight"),
    isItalic: selection.hasFormat("italic"),
    isLink: linkNode !== null,
    isStrikethrough: selection.hasFormat("strikethrough"),
    isUnderline: selection.hasFormat("underline"),
  };
};

export const readFloatingToolbarState = (): FloatingToolbarState => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) && !selection.isCollapsed())) {
    return {
      formats: DEFAULT_FORMAT_STATE,
      isVisible: false,
      linkUrl: "",
      position: EMPTY_TOOLBAR_POSITION,
    };
  }

  const node = getFloatingToolbarSelectedNode(selection);
  const parent = node.getParent();
  const isInsideCodeBlock =
    $isCodeNode(node) || (parent && $isCodeNode(parent));

  if (isInsideCodeBlock) {
    return {
      formats: DEFAULT_FORMAT_STATE,
      isVisible: false,
      linkUrl: "",
      position: EMPTY_TOOLBAR_POSITION,
    };
  }

  const position = getToolbarPosition();
  if (!position) {
    return {
      formats: DEFAULT_FORMAT_STATE,
      isVisible: false,
      linkUrl: "",
      position: EMPTY_TOOLBAR_POSITION,
    };
  }

  const linkNode = isSelectionWithinSingleLink(selection)
    ? getSelectedLinkNode(node)
    : null;

  return {
    formats: getFormatState(selection, node),
    isVisible: true,
    linkUrl: linkNode?.getURL() ?? "",
    position,
  };
};
