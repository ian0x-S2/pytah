export interface FullToolbarUiState {
  activeBlockTypeIndex: number;
  activeInsertIndex: number;
  blockTypeOpen: boolean;
  insertOpen: boolean;
}

export type FullToolbarUiAction =
  | { type: "set-active-block-type-index"; payload: number }
  | { type: "set-active-insert-index"; payload: number }
  | {
      type: "set-block-type-open";
      payload: { activeBlockTypeIndex?: number; open: boolean };
    }
  | {
      type: "set-insert-open";
      payload: { activeInsertIndex?: number; open: boolean };
    };

export const INITIAL_UI_STATE: FullToolbarUiState = {
  activeBlockTypeIndex: 0,
  activeInsertIndex: 0,
  blockTypeOpen: false,
  insertOpen: false,
};
