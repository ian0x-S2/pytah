import type { FullToolbarUiAction, FullToolbarUiState } from "./types";

export const fullToolbarUiReducer = (
  state: FullToolbarUiState,
  action: FullToolbarUiAction
): FullToolbarUiState => {
  switch (action.type) {
    case "set-active-block-type-index": {
      return state.activeBlockTypeIndex === action.payload
        ? state
        : { ...state, activeBlockTypeIndex: action.payload };
    }
    case "set-active-insert-index": {
      return state.activeInsertIndex === action.payload
        ? state
        : { ...state, activeInsertIndex: action.payload };
    }
    case "set-block-type-open": {
      return {
        ...state,
        activeBlockTypeIndex:
          action.payload.activeBlockTypeIndex ?? state.activeBlockTypeIndex,
        blockTypeOpen: action.payload.open,
      };
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
