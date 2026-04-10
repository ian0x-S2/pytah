import type { NodeKey } from "lexical";

export interface SelectionCounts {
  columns: number;
  rows: number;
}

export interface ButtonPosition {
  left: number;
  top: number;
}

export interface TableMenuContext {
  position: ButtonPosition;
  selectionCounts: SelectionCounts;
}

export interface TableSelectionState {
  columnCount: number;
  columnIndex: number;
  isActive: boolean;
  rowCount: number;
  rowIndex: number;
  tableKey: NodeKey | null;
}
