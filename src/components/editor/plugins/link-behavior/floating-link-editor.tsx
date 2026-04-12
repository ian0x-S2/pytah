"use client";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../floating-toolbar/link-command";
import {
  areFloatingToolbarPositionsEqual,
  getFloatingToolbarSelectedNode,
} from "../floating-toolbar/selection";
import { FloatingLinkEditorPanel } from "./floating-link-editor-panel";
import {
  EMPTY_POSITION,
  type FloatingLinkEditorPosition,
  getLinkEditorPosition,
  readSelectedLinkUrl,
  selectionContainsLink,
} from "./floating-link-editor-position";
import { LINK_PLACEHOLDER_URL } from "./utils";

interface FloatingLinkEditorState {
  editedLinkUrl: string;
  isLink: boolean;
  isLinkEditMode: boolean;
  linkUrl: string;
  position: FloatingLinkEditorPosition;
}

type FloatingLinkEditorAction =
  | {
      type: "sync";
      payload: {
        isLink: boolean;
        linkUrl: string;
        position: FloatingLinkEditorPosition;
      };
    }
  | {
      type: "open-edit-mode";
      payload?: {
        editedLinkUrl?: string;
      };
    }
  | { type: "close-edit-mode" }
  | { type: "close-link-editor" }
  | { type: "set-edited-link-url"; payload: string };

const INITIAL_STATE: FloatingLinkEditorState = {
  editedLinkUrl: LINK_PLACEHOLDER_URL,
  isLink: false,
  isLinkEditMode: false,
  linkUrl: "",
  position: EMPTY_POSITION,
};

const floatingLinkEditorReducer = (
  state: FloatingLinkEditorState,
  action: FloatingLinkEditorAction
): FloatingLinkEditorState => {
  switch (action.type) {
    case "sync": {
      const { isLink, linkUrl, position } = action.payload;
      const nextPosition = areFloatingToolbarPositionsEqual(
        state.position,
        position
      )
        ? state.position
        : position;

      return {
        ...state,
        editedLinkUrl: state.isLinkEditMode
          ? state.editedLinkUrl
          : linkUrl || LINK_PLACEHOLDER_URL,
        isLink,
        isLinkEditMode:
          position === EMPTY_POSITION ? false : state.isLinkEditMode,
        linkUrl,
        position: nextPosition,
      };
    }
    case "open-edit-mode": {
      return {
        ...state,
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

export function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(
    floatingLinkEditorReducer,
    INITIAL_STATE
  );
  const { editedLinkUrl, isLink, isLinkEditMode, linkUrl, position } = state;

  const updateLinkEditor = useCallback(() => {
    const nextIsLink = selectionContainsLink();
    const nextLinkUrl = nextIsLink ? readSelectedLinkUrl() : "";
    const nextPosition = getLinkEditorPosition(editor) ?? EMPTY_POSITION;

    dispatch({
      type: "sync",
      payload: {
        isLink: nextIsLink,
        linkUrl: nextLinkUrl,
        position: nextPosition,
      },
    });
  }, [editor]);

  const scheduleLinkEditorUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        scheduleLinkEditorUpdate();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          scheduleLinkEditorUpdate();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_FLOATING_LINK_EDITOR_COMMAND,
        () => {
          dispatch({
            type: "open-edit-mode",
            payload: {
              editedLinkUrl: readSelectedLinkUrl() || LINK_PLACEHOLDER_URL,
            },
          });
          scheduleLinkEditorUpdate();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const isModifierPressed = event.metaKey || event.ctrlKey;
          if (!(isModifierPressed && event.key.toLowerCase() === "k")) {
            return false;
          }

          event.preventDefault();

          if (selectionContainsLink()) {
            dispatch({ type: "close-edit-mode" });
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            return true;
          }

          dispatch({
            type: "open-edit-mode",
            payload: { editedLinkUrl: LINK_PLACEHOLDER_URL },
          });
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!isLink) {
            return false;
          }

          dispatch({ type: "close-link-editor" });
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const node = getFloatingToolbarSelectedNode(selection);
          const linkNode = $findMatchingParent(node, $isLinkNode);
          if ($isLinkNode(linkNode) && (event.metaKey || event.ctrlKey)) {
            window.open(linkNode.getURL(), "_blank", "noopener,noreferrer");
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, isLink, scheduleLinkEditorUpdate]);

  useEffect(() => {
    scheduleLinkEditorUpdate();
  }, [scheduleLinkEditorUpdate]);

  useEffect(() => {
    const handleWindowChange = () => {
      scheduleLinkEditorUpdate();
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [scheduleLinkEditorUpdate]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const floatingElement = editorRef.current;
    if (!floatingElement) {
      return;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (
        !floatingElement.contains(event.relatedTarget as Node | null) &&
        isLink
      ) {
        dispatch({ type: "close-link-editor" });
      }
    };

    floatingElement.addEventListener("focusout", handleFocusOut);
    return () => {
      floatingElement.removeEventListener("focusout", handleFocusOut);
    };
  }, [isLink]);

  const handleInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      if (!(element && isLinkEditMode)) {
        return;
      }

      element.focus();
      element.select();
    },
    [isLinkEditMode]
  );

  if (!isLink) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50"
      ref={editorRef}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      <FloatingLinkEditorPanel
        editedLinkUrl={editedLinkUrl}
        editor={editor}
        inputRef={handleInputRef}
        isLinkEditMode={isLinkEditMode}
        linkUrl={linkUrl}
        onEditedLinkUrlChange={(value) =>
          dispatch({ type: "set-edited-link-url", payload: value })
        }
        onRequestCloseEditMode={() => dispatch({ type: "close-edit-mode" })}
        onRequestEditMode={() => dispatch({ type: "open-edit-mode" })}
      />
    </div>,
    document.body
  );
}
