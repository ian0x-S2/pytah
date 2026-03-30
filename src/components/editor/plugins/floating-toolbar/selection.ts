import { $isCodeNode } from "@lexical/code";
import { $isLinkNode } from "@lexical/link";
import {
  $getSelection,
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

const getSelectedNode = (selection: RangeSelection) => {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  if (anchorNode === focusNode) {
    return anchorNode;
  }

  return selection.isBackward() ? anchorNode : focusNode;
};

const getLinkNode = (node: LexicalNode) => {
  const parent = node.getParent();

  if ($isLinkNode(parent)) {
    return parent;
  }

  if ($isLinkNode(node)) {
    return node;
  }

  return null;
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
  const linkNode = getLinkNode(node);

  return {
    isBold: selection.hasFormat("bold"),
    isCode: selection.hasFormat("code"),
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

  const node = getSelectedNode(selection);
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

  const linkNode = getLinkNode(node);

  return {
    formats: getFormatState(selection, node),
    isVisible: true,
    linkUrl: linkNode?.getURL() ?? "",
    position,
  };
};
