import {
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  type TableSelection,
} from "@lexical/table";
import { $getSelection, $isRangeSelection, type LexicalEditor } from "lexical";
import type {
  SelectionCounts,
  TableMenuContext,
  TableSelectionState,
} from "./types";

export const DEFAULT_SELECTION_COUNTS: SelectionCounts = {
  columns: 1,
  rows: 1,
};

export const EMPTY_TABLE_SELECTION_STATE: TableSelectionState = {
  columnCount: 0,
  columnIndex: -1,
  isActive: false,
  rowCount: 0,
  rowIndex: -1,
  tableKey: null,
};

export const readTableSelectionState = (): TableSelectionState => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return EMPTY_TABLE_SELECTION_STATE;
  }

  const anchorNode = selection.anchor.getNode();
  const tableCellNode = $getTableCellNodeFromLexicalNode(anchorNode);

  if (!tableCellNode) {
    return EMPTY_TABLE_SELECTION_STATE;
  }

  const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
  const firstRow = tableNode.getFirstChild();
  const columnCount = $isTableRowNode(firstRow)
    ? firstRow.getChildrenSize()
    : 0;

  return {
    columnCount,
    columnIndex: $getTableColumnIndexFromTableCellNode(tableCellNode),
    isActive: true,
    rowCount: tableNode.getChildrenSize(),
    rowIndex: $getTableRowIndexFromTableCellNode(tableCellNode),
    tableKey: tableNode.getKey(),
  };
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

  const tableCellElement = editor.getElementByKey(tableCellNode.getKey());
  if (!tableCellElement) {
    return null;
  }

  const cellRect = tableCellElement.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();
  const buttonSize = 20;

  return {
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
