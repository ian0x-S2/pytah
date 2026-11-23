import {
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableSelection,
} from "@lexical/table";
import type { TableSelection } from "@lexical/table";
import { $getSelection, $isRangeSelection } from "lexical";
import type { LexicalEditor } from "lexical";

import type { SelectionCounts, TableMenuContext } from "./types";

export const DEFAULT_SELECTION_COUNTS: SelectionCounts = {
  columns: 1,
  rows: 1,
};

export const areSelectionCountsEqual = (
  left: SelectionCounts,
  right: SelectionCounts
) => left.columns === right.columns && left.rows === right.rows;

export const resolveNextMenuIndex = (
  currentIndex: number,
  itemCount: number,
  shiftKey: boolean
): number => {
  if (itemCount <= 0) {
    return 0;
  }
  if (shiftKey) {
    return currentIndex <= 0 ? itemCount - 1 : currentIndex - 1;
  }
  return currentIndex >= itemCount - 1 ? 0 : currentIndex + 1;
};

export const resolveSelectionCounts = (
  selection: ReturnType<typeof $getSelection>
): SelectionCounts => {
  if (!$isTableSelection(selection)) {
    return DEFAULT_SELECTION_COUNTS;
  }

  const shape = (selection as TableSelection).getShape();
  return {
    columns: shape.toX - shape.fromX + 1,
    rows: shape.toY - shape.fromY + 1,
  };
};

export const readTableMenuContext = (
  editor: LexicalEditor,
  anchorElem: HTMLElement
): TableMenuContext | null => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) || $isTableSelection(selection))) {
    return null;
  }

  const tableCellNode = $getTableCellNodeFromLexicalNode(
    selection.anchor.getNode()
  );
  if (!tableCellNode?.isAttached()) {
    return null;
  }

  const focusTableCellNode = $getTableCellNodeFromLexicalNode(
    selection.focus.getNode()
  );
  if (
    !focusTableCellNode?.isAttached() ||
    !$getTableNodeFromLexicalNodeOrThrow(tableCellNode).is(
      $getTableNodeFromLexicalNodeOrThrow(focusTableCellNode)
    )
  ) {
    return null;
  }

  const tableCellElement = editor.getElementByKey(tableCellNode.getKey());
  if (!tableCellElement) {
    return null;
  }

  const cellRect = tableCellElement.getBoundingClientRect();
  const scrollWrapper = tableCellElement.closest(
    ".editor-table-scroll-wrapper"
  );
  if (scrollWrapper) {
    const wrapperRect = scrollWrapper.getBoundingClientRect();
    if (
      wrapperRect.width > 0 &&
      (cellRect.right <= wrapperRect.left || cellRect.left >= wrapperRect.right)
    ) {
      return null;
    }
  }

  const anchorRect = anchorElem.getBoundingClientRect();
  const buttonSize = 20;

  return {
    cellKey: tableCellNode.getKey(),
    position: {
      left: cellRect.right - anchorRect.left - buttonSize - 6,
      top:
        cellRect.top -
        anchorRect.top +
        Math.round((cellRect.height - buttonSize) / 2),
    },
    selectionCounts: resolveSelectionCounts(selection),
  };
};
