import type { FloatingLinkEditorAnchor } from "./floating-link-editor-position";
import { isSameLinkEditorAnchor } from "./floating-link-editor-position";
import { LINK_PLACEHOLDER_URL } from "./utils";

/**
 * Which surface the plugin renders:
 * - `closed` — nothing
 * - `preview` — the Google-Docs-style hover chip (label + Edit)
 * - `edit` — the full editing card
 *
 * The chip is purely hover-driven: a click that merely places the caret
 * inside a link never opens anything. The card opens only through an
 * explicit action (chip Edit, toolbar link button, Cmd/Ctrl+K).
 */
export type FloatingLinkEditorSurface = "closed" | "edit" | "preview";

/** The hovered link: its meta and rect, kept so the chip survives re-syncs. */
export interface FloatingLinkPreviewTarget {
  anchor: FloatingLinkEditorAnchor;
  linkKey: string;
  linkText: string;
  linkUrl: string;
}

export interface FloatingLinkEditorState {
  anchor: FloatingLinkEditorAnchor | null;
  editedLinkText: string;
  editedLinkUrl: string;
  hoverTarget: FloatingLinkPreviewTarget | null;
  isLink: boolean;
  isLinkEditMode: boolean;
  linkText: string;
  linkUrl: string;
  surface: FloatingLinkEditorSurface;
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
  | { type: "hover-link"; payload: FloatingLinkPreviewTarget }
  | { type: "unhover-link" }
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
  hoverTarget: null,
  isLink: false,
  isLinkEditMode: false,
  linkText: "",
  linkUrl: "",
  surface: "closed",
};

const keepHoverChip = (
  state: FloatingLinkEditorState,
  linkText: string,
  linkUrl: string
): FloatingLinkEditorState => ({
  ...state,
  anchor: state.anchor,
  isLink: false,
  linkText,
  linkUrl,
  surface: "preview",
});

const closeEverySurface = (
  state: FloatingLinkEditorState,
  payload: { isLink: boolean; linkText: string; linkUrl: string }
): FloatingLinkEditorState => ({
  ...state,
  anchor: null,
  isLink: payload.isLink,
  isLinkEditMode: false,
  linkText: payload.linkText,
  linkUrl: payload.linkUrl,
  surface: "closed",
});

const keepOpenSurface = (
  state: FloatingLinkEditorState,
  nextAnchor: FloatingLinkEditorAnchor,
  payload: Extract<FloatingLinkEditorAction, { type: "sync" }>["payload"]
): FloatingLinkEditorState => ({
  ...state,
  anchor: nextAnchor,
  editedLinkText: state.isLinkEditMode
    ? state.editedLinkText
    : payload.linkText,
  editedLinkUrl: state.isLinkEditMode
    ? state.editedLinkUrl
    : payload.linkUrl || LINK_PLACEHOLDER_URL,
  isLink: true,
  isLinkEditMode: state.isLinkEditMode,
  linkText: payload.linkText,
  linkUrl: payload.linkUrl,
  surface:
    state.isLinkEditMode || state.surface === "edit" ? "edit" : state.surface,
});

const isEditSurface = (state: FloatingLinkEditorState): boolean =>
  state.isLinkEditMode || state.surface === "edit";

const applySyncAction = (
  state: FloatingLinkEditorState,
  payload: Extract<FloatingLinkEditorAction, { type: "sync" }>["payload"]
): FloatingLinkEditorState => {
  const { anchor, isLink, linkText, linkUrl } = payload;

  // The selection itself carries no link anymore: the edit card dies with
  // it, but a live hover chip is caret-independent and survives — the
  // pointer's link is separate from the selection.
  if (!isLink) {
    if (state.surface === "preview" && !isEditSurface(state)) {
      return keepHoverChip(state, linkText, linkUrl);
    }

    return closeEverySurface(state, { isLink, linkText, linkUrl });
  }

  // The anchor reads the native selection, which is momentarily unavailable
  // during focus transitions (e.g. a toolbar mousedown) right after an
  // explicit open. Keep the last known anchor so the popover is not dropped
  // before the user types; a null anchor with no open surface is just a
  // closed state.
  if (anchor === null) {
    if (!isEditSurface(state)) {
      return closeEverySurface(state, { isLink, linkText, linkUrl });
    }

    return state.anchor === null
      ? closeEverySurface(state, { isLink, linkText, linkUrl })
      : keepOpenSurface(state, state.anchor, payload);
  }

  const nextAnchor = isSameLinkEditorAnchor(state.anchor, anchor)
    ? state.anchor
    : anchor;

  return keepOpenSurface(state, nextAnchor, payload);
};

const applyHoverLink = (
  state: FloatingLinkEditorState,
  payload: FloatingLinkPreviewTarget
): FloatingLinkEditorState => {
  // The edit card owns the pointer's attention — hovering another link
  // must not pop a chip over it. Re-hovering the same link is a no-op
  // (identical state) so pointerover bursts don't loop re-renders.
  const isSameTarget =
    state.hoverTarget !== null &&
    state.hoverTarget.linkKey === payload.linkKey &&
    isSameLinkEditorAnchor(state.hoverTarget.anchor, payload.anchor);

  if (state.isLinkEditMode || isSameTarget) {
    return state;
  }

  return {
    ...state,
    anchor: payload.anchor,
    editedLinkText: payload.linkText,
    editedLinkUrl: payload.linkUrl || LINK_PLACEHOLDER_URL,
    hoverTarget: payload,
    surface: "preview",
  };
};

const applyUnhoverLink = (
  state: FloatingLinkEditorState
): FloatingLinkEditorState => {
  if (state.hoverTarget === null) {
    return state;
  }

  return {
    ...state,
    anchor: null,
    hoverTarget: null,
    surface: state.isLinkEditMode ? "edit" : "closed",
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
    case "hover-link": {
      return applyHoverLink(state, action.payload);
    }
    case "unhover-link": {
      return applyUnhoverLink(state);
    }
    case "open-edit-mode": {
      return {
        ...state,
        editedLinkText: action.payload?.editedLinkText ?? state.linkText,
        editedLinkUrl:
          action.payload?.editedLinkUrl ??
          (state.linkUrl || LINK_PLACEHOLDER_URL),
        isLinkEditMode: true,
        surface: "edit",
      };
    }
    case "close-link-editor": {
      return state.isLink || state.isLinkEditMode
        ? {
            ...state,
            anchor: null,
            hoverTarget: null,
            isLink: false,
            isLinkEditMode: false,
            surface: "closed",
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
