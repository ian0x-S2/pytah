import type { FloatingLinkEditorAnchor } from "./floating-link-editor-position";
import { isSameLinkEditorAnchor } from "./floating-link-editor-position";
import { LINK_PLACEHOLDER_URL } from "./utils";

export interface FloatingLinkEditorState {
  anchor: FloatingLinkEditorAnchor | null;
  editedLinkText: string;
  editedLinkUrl: string;
  isLink: boolean;
  isLinkEditMode: boolean;
  linkText: string;
  linkUrl: string;
}

export type FloatingLinkEditorAction =
  | {
      type: "sync";
      payload: {
        anchor: FloatingLinkEditorAnchor | null;
        isLink: boolean;
        linkText: string;
        linkUrl: string;
      };
    }
  | {
      type: "open-edit-mode";
      payload?: {
        editedLinkText?: string;
        editedLinkUrl?: string;
      };
    }
  | { type: "close-link-editor" }
  | { type: "set-edited-link-text"; payload: string }
  | { type: "set-edited-link-url"; payload: string };

export const FLOATING_LINK_EDITOR_INITIAL_STATE: FloatingLinkEditorState = {
  anchor: null,
  editedLinkText: "",
  editedLinkUrl: LINK_PLACEHOLDER_URL,
  isLink: false,
  isLinkEditMode: false,
  linkText: "",
  linkUrl: "",
};

const applySyncAction = (
  state: FloatingLinkEditorState,
  payload: Extract<FloatingLinkEditorAction, { type: "sync" }>["payload"]
): FloatingLinkEditorState => {
  const { anchor, isLink, linkText, linkUrl } = payload;
  // The anchor reads the native selection, which is momentarily unavailable
  // during focus transitions (e.g. a toolbar mousedown) right after an
  // explicit open. Keep the last known anchor so the popover is not dropped
  // before the user types.
  let nextAnchor = state.anchor;
  if (anchor !== null && !isSameLinkEditorAnchor(state.anchor, anchor)) {
    nextAnchor = anchor;
  }

  return {
    ...state,
    anchor: nextAnchor,
    editedLinkText: state.isLinkEditMode ? state.editedLinkText : linkText,
    editedLinkUrl: state.isLinkEditMode
      ? state.editedLinkUrl
      : linkUrl || LINK_PLACEHOLDER_URL,
    isLink,
    isLinkEditMode: nextAnchor === null ? false : state.isLinkEditMode,
    linkText,
    linkUrl,
  };
};

export const floatingLinkEditorReducer = (
  state: FloatingLinkEditorState,
  action: FloatingLinkEditorAction
): FloatingLinkEditorState => {
  switch (action.type) {
    case "sync": {
      return applySyncAction(state, action.payload);
    }
    case "open-edit-mode": {
      return {
        ...state,
        editedLinkText: action.payload?.editedLinkText ?? state.linkText,
        editedLinkUrl:
          action.payload?.editedLinkUrl ??
          (state.linkUrl || LINK_PLACEHOLDER_URL),
        isLinkEditMode: true,
      };
    }
    case "close-edit-mode": {
      return state.isLinkEditMode ? { ...state, isLinkEditMode: false } : state;
    }
    case "close-link-editor": {
      return state.isLink || state.isLinkEditMode
        ? {
            ...state,
            anchor: null,
            isLink: false,
            isLinkEditMode: false,
          }
        : state;
    }
    case "set-edited-link-text": {
      return state.editedLinkText === action.payload
        ? state
        : { ...state, editedLinkText: action.payload };
    }
    case "set-edited-link-url": {
      return state.editedLinkUrl === action.payload
        ? state
        : { ...state, editedLinkUrl: action.payload };
    }
    default: {
      return state;
    }
  }
};
