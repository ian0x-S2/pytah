import type { LexicalEditor } from "lexical";
import { $getSelection, $isNodeSelection, $isRangeSelection } from "lexical";

import {
  getFloatingToolbarSelectedNode,
  getSelectedLinkNode,
  isSelectionWithinSingleLink,
} from "../floating-toolbar/selection";

/**
 * A plain selection rectangle (floating-ui `ClientRectObject` shape) used as
 * the virtual anchor of the link popover. Snapshotting the fields keeps the
 * reducer state serializable and the popover re-derives it on scroll/resize.
 */
export interface FloatingLinkEditorAnchor {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}

const toAnchor = (rect: DOMRect): FloatingLinkEditorAnchor => ({
  bottom: rect.bottom,
  height: rect.height,
  left: rect.left,
  right: rect.right,
  top: rect.top,
  width: rect.width,
  x: rect.x,
  y: rect.y,
});

/**
 * Snapshots a DOM rect into the serializable anchor shape. Used both by the
 * selection anchor reader and by the hover-driven preview chip.
 */
export const toFloatingLinkEditorAnchor = toAnchor;

/**
 * True when the native selection still lives inside the editor root. The
 * edit card's inputs own the native selection while open, so unmounting them
 * (X button, Escape, outside press, Apply) kills it — a `false` here means
 * the Lexical selection still pointing at the link is stale and nothing
 * should resurrect it (e.g. checklist ticks re-sync the DOM selection with
 * the editor's selection, which would yank the caret back into the link).
 */
export const isNativeSelectionWithinEditor = (
  rootElement: HTMLElement | null,
  nativeSelection: Selection | null
): boolean =>
  rootElement !== null &&
  nativeSelection !== null &&
  nativeSelection.rangeCount > 0 &&
  nativeSelection.anchorNode !== null &&
  rootElement.contains(nativeSelection.anchorNode);

/**
 * Resolves the rectangle the link popover anchors to: the exact range rect
 * when text is selected, the caret line's text span when collapsed, and the
 * node element for node selections. Returns `null` when the native selection
 * is unavailable (e.g. a focus transition outside the editor).
 */
export const getLinkEditorAnchor = (
  editor: LexicalEditor
): FloatingLinkEditorAnchor | null => {
  const selection = $getSelection();
  const nativeSelection = window.getSelection();
  const rootElement = editor.getRootElement();

  if (!(selection && rootElement && editor.isEditable())) {
    return null;
  }

  let rectangle: DOMRect | null = null;

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    const element = node ? editor.getElementByKey(node.getKey()) : null;
    rectangle = element?.getBoundingClientRect() ?? null;
  } else if (
    nativeSelection &&
    nativeSelection.rangeCount > 0 &&
    rootElement.contains(nativeSelection.anchorNode)
  ) {
    rectangle = nativeSelection.isCollapsed
      ? (nativeSelection.focusNode?.parentElement?.getBoundingClientRect() ??
        nativeSelection.getRangeAt(0).getBoundingClientRect())
      : nativeSelection.getRangeAt(0).getBoundingClientRect();
  }

  return rectangle ? toAnchor(rectangle) : null;
};

export const readSelectedLinkUrl = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    if (!isSelectionWithinSingleLink(selection)) {
      return "";
    }

    return (
      getSelectedLinkNode(
        getFloatingToolbarSelectedNode(selection)
      )?.getURL() ?? ""
    );
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return node ? (getSelectedLinkNode(node)?.getURL() ?? "") : "";
  }

  return "";
};

export const readSelectedLinkText = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    if (!isSelectionWithinSingleLink(selection)) {
      return "";
    }

    return (
      getSelectedLinkNode(
        getFloatingToolbarSelectedNode(selection)
      )?.getTextContent() ?? ""
    );
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return node ? (getSelectedLinkNode(node)?.getTextContent() ?? "") : "";
  }

  return "";
};

export const selectionContainsLink = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    return isSelectionWithinSingleLink(selection);
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return Boolean(node && getSelectedLinkNode(node));
  }

  return false;
};

export const isSameLinkEditorAnchor = (
  current: FloatingLinkEditorAnchor | null,
  next: FloatingLinkEditorAnchor
): boolean =>
  current !== null &&
  current.left === next.left &&
  current.top === next.top &&
  current.width === next.width &&
  current.height === next.height;
