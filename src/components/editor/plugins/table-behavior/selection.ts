import {
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableRowNode,
} from "@lexical/table";
import { $getSelection, $isRangeSelection } from "lexical";
import type { TableSelectionState } from "./types";

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
