import type { LexicalEditor } from "lexical";
import { $getSelection, $isNodeSelection, $isRangeSelection } from "lexical";
import {
  getFloatingToolbarSelectedNode,
  getSelectedLinkNode,
  isSelectionWithinSingleLink,
} from "../floating-toolbar/selection";

export interface FloatingLinkEditorPosition {
  left: number;
  top: number;
}

const LINK_EDITOR_OFFSET = 12;

export const EMPTY_POSITION: FloatingLinkEditorPosition = { left: 0, top: 0 };

export const getLinkEditorPosition = (
  editor: LexicalEditor
): FloatingLinkEditorPosition | null => {
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
    rootElement.contains(nativeSelection.anchorNode)
  ) {
    rectangle =
      nativeSelection.focusNode?.parentElement?.getBoundingClientRect() ??
      nativeSelection.getRangeAt(0).getBoundingClientRect();
  }

  if (!rectangle) {
    return null;
  }

  return {
    left: rectangle.left,
    top: rectangle.bottom + LINK_EDITOR_OFFSET,
  };
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
