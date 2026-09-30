import { areFloatingToolbarPositionsEqual } from "../floating-toolbar/selection";
import { EMPTY_POSITION } from "./floating-link-editor-position";
import type { FloatingLinkEditorPosition } from "./floating-link-editor-position";
import { LINK_PLACEHOLDER_URL } from "./utils";

export interface FloatingLinkEditorState {
  editedLinkText: string;
  editedLinkUrl: string;
  isLink: boolean;
  isLinkEditMode: boolean;
  linkText: string;
  linkUrl: string;
  position: FloatingLinkEditorPosition;
}

export type FloatingLinkEditorAction =
  | {
      type: "sync";
      payload: {
        isLink: boolean;
        linkText: string;
        linkUrl: string;
        position: FloatingLinkEditorPosition;
      };
    }
  | {
      type: "open-edit-mode";
      payload?: {
        editedLinkText?: string;
        editedLinkUrl?: string;
      };
    }
  | { type: "close-edit-mode" }
  | { type: "close-link-editor" }
  | { type: "set-edited-link-text"; payload: string }
  | { type: "set-edited-link-url"; payload: string };

export const FLOATING_LINK_EDITOR_INITIAL_STATE: FloatingLinkEditorState = {
  editedLinkText: "",
  editedLinkUrl: LINK_PLACEHOLDER_URL,
  isLink: false,
  isLinkEditMode: false,
  linkText: "",
  linkUrl: "",
  position: EMPTY_POSITION,
};

type SyncPayload = Extract<
  FloatingLinkEditorAction,
  { type: "sync" }
>["payload"];

const applySyncAction = (
  state: FloatingLinkEditorState,
  payload: SyncPayload
): FloatingLinkEditorState => {
  const { isLink, linkText, linkUrl, position } = payload;
  // The position reads the native selection, which is momentarily empty
  // during focus transitions (e.g. a toolbar mousedown) right after an
  // explicit open. Keep the last known anchor while the selection is
  // still on the link so edit mode is not dropped before the user types.
  let nextPosition = state.position;
  if (position !== EMPTY_POSITION) {
    nextPosition = areFloatingToolbarPositionsEqual(state.position, position)
      ? state.position
      : position;
  }

  return {
    ...state,
    editedLinkText: state.isLinkEditMode ? state.editedLinkText : linkText,
    editedLinkUrl: state.isLinkEditMode
      ? state.editedLinkUrl
      : linkUrl || LINK_PLACEHOLDER_URL,
    isLink,
    isLinkEditMode:
      nextPosition === EMPTY_POSITION ? false : state.isLinkEditMode,
    linkText,
    linkUrl,
    position: nextPosition,
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
        ? { ...state, isLink: false, isLinkEditMode: false }
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
