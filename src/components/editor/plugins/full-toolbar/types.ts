export interface FullToolbarUiState {
  activeInsertIndex: number;
  insertOpen: boolean;
}

export type FullToolbarUiAction =
  | { type: "set-active-insert-index"; payload: number }
  | {
      type: "set-insert-open";
      payload: { activeInsertIndex?: number; open: boolean };
    };

export const INITIAL_UI_STATE: FullToolbarUiState = {
  activeInsertIndex: 0,
  insertOpen: false,
};
