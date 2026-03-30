import type { NodeKey } from "lexical";

export interface TableSelectionState {
  columnCount: number;
  columnIndex: number;
  isActive: boolean;
  rowCount: number;
  rowIndex: number;
  tableKey: NodeKey | null;
}
