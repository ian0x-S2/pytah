import type { NodeKey } from "lexical";

export interface TableSelectionState {
  columnCount: number;
  columnIndex: number;
  isActive: boolean;
  rowCount: number;
  rowIndex: number;
  tableKey: NodeKey | null;
}

export interface TableOverlayPosition {
  height: number;
  isVisible: boolean;
  left: number;
  top: number;
  width: number;
}
