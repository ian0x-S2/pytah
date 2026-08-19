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
  cellKey: NodeKey;
  position: ButtonPosition;
  selectionCounts: SelectionCounts;
}
