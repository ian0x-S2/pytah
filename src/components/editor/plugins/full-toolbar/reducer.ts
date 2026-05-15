import type { FullToolbarUiAction, FullToolbarUiState } from "./types";

export const fullToolbarUiReducer = (
  state: FullToolbarUiState,
  action: FullToolbarUiAction
): FullToolbarUiState => {
  switch (action.type) {
    case "set-active-insert-index": {
      return state.activeInsertIndex === action.payload
        ? state
        : { ...state, activeInsertIndex: action.payload };
    }
    case "set-insert-open": {
      return {
        ...state,
        activeInsertIndex:
          action.payload.activeInsertIndex ?? state.activeInsertIndex,
        insertOpen: action.payload.open,
      };
    }
    default: {
      return state;
    }
  }
};
