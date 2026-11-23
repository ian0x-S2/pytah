"use client";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
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
import type { Dispatch } from "react";
import { useEffect, useEffectEvent, useMemo, useReducer, useRef } from "react";

import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "./commands";
import { useEditCardCloseSelectionReconcile } from "./floating-link-editor-close-reconcile";
import {
  getLinkEditorAnchor,
  readSelectedLinkText,
  readSelectedLinkUrl,
  selectionContainsLink,
} from "./floating-link-editor-position";
import {
  FLOATING_LINK_EDITOR_INITIAL_STATE,
  floatingLinkEditorReducer,
} from "./floating-link-editor-reducer";
import type {
  FloatingLinkEditorAction,
  FloatingLinkPreviewTarget,
} from "./floating-link-editor-reducer";
import { FloatingLinkEditorSurfaces } from "./floating-link-editor-surfaces";
import {
  getHoveredEditorLink,
  isInsideLinkSurface,
  readLinkElementAnchor,
} from "./floating-link-hover";
import { createHoverBridge } from "./floating-link-hover-bridge";
import { getFloatingToolbarSelectedNode } from "./selection";
import { LINK_PLACEHOLDER_URL, sanitizeEditorLinkUrl } from "./utils";

/** Grace period (ms) the pointer has to travel from link text into the chip. */
const HOVER_BRIDGE_DELAY_MS = 120;

const refreshHoveredAnchor = (
  editor: LexicalEditor,
  hoverTarget: FloatingLinkPreviewTarget | null,
  dispatch: Dispatch<FloatingLinkEditorAction>
) => {
  if (hoverTarget === null) {
    return;
  }

  const linkElement = editor.getElementByKey(hoverTarget.linkKey);
  if (!(linkElement instanceof HTMLAnchorElement)) {
    dispatch({ type: "unhover-link" });
    return;
  }

  const anchorRect = readLinkElementAnchor(linkElement);
  if (anchorRect === null) {
    dispatch({ type: "unhover-link" });
    return;
  }

  dispatch({
    payload: {
      anchor: anchorRect,
      linkKey: hoverTarget.linkKey,
      linkText: hoverTarget.linkText,
      linkUrl: hoverTarget.linkUrl,
    },
    type: "hover-link",
  });
};

function useFloatingLinkHover(
  editor: LexicalEditor,
  hoverTarget: FloatingLinkPreviewTarget | null,
  dispatch: Dispatch<FloatingLinkEditorAction>
) {
  // Owns the hover grace timer. `dispatch` is stable across renders, so the
  // bridge is created once; the StrictMode double-mount reuses it after
  // cleanup disposed any pending timer.
  const hoverBridge = useMemo(
    () =>
      createHoverBridge({
        graceMs: HOVER_BRIDGE_DELAY_MS,
        onGraceExpired: () => dispatch({ type: "unhover-link" }),
      }),
    [dispatch]
  );

  // Hover wiring for the preview chip. The pointer's link is tracked on the
  // document — hover is independent of the selection, so a click that merely
  // places the caret inside a link never opens anything.
  useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      if (isInsideLinkSurface(event.target, editor.getKey())) {
        hoverBridge.onSurface();
        return;
      }

      const hovered = getHoveredEditorLink(editor, event.target);
      if (hovered === null) {
        hoverBridge.onPlainContent();
        return;
      }

      const anchorRect = readLinkElementAnchor(hovered.linkElement);
      if (anchorRect === null) {
        dispatch({ type: "unhover-link" });
        return;
      }

      hoverBridge.onLink();
      dispatch({
        payload: {
          anchor: anchorRect,
          linkKey: hovered.linkKey,
          linkText: hovered.linkText,
          linkUrl: hovered.linkUrl,
        },
        type: "hover-link",
      });
    };

    document.addEventListener("pointerover", handlePointerOver, true);
    return () => {
      document.removeEventListener("pointerover", handlePointerOver, true);
      hoverBridge.dispose();
    };
  }, [dispatch, editor, hoverBridge]);

  // Keep the chip's anchor glued to the hovered link whenever hoverTarget changes.
  useEffect(() => {
    refreshHoveredAnchor(editor, hoverTarget, dispatch);
  }, [dispatch, editor, hoverTarget]);

  const handlePointerOverChipChange = (isOver: boolean) => {
    if (isOver) {
      hoverBridge.onSurface();
      return;
    }

    dispatch({ type: "unhover-link" });
  };

  return { handlePointerOverChipChange };
}

export function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext();
  const animationFrameRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(
    floatingLinkEditorReducer,
    FLOATING_LINK_EDITOR_INITIAL_STATE
  );
  const { anchor, hoverTarget, surface } = state;
  const surfaceRef = useRef(surface);
  const hoverTargetRef = useRef(hoverTarget);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    surfaceRef.current = surface;
    hoverTargetRef.current = hoverTarget;
  }, [hoverTarget, surface]);

  const { handlePointerOverChipChange } = useFloatingLinkHover(
    editor,
    hoverTarget,
    dispatch
  );

  const updateLinkEditor = () => {
    const nextIsLink = selectionContainsLink();
    const nextLinkText = nextIsLink ? readSelectedLinkText() : "";
    const nextLinkUrl = nextIsLink ? readSelectedLinkUrl() : "";
    const nextAnchor = getLinkEditorAnchor(editor);

    dispatch({
      payload: {
        anchor: nextAnchor,
        isLink: nextIsLink,
        linkText: nextLinkText,
        linkUrl: nextLinkUrl,
      },
      type: "sync",
    });

    if (surfaceRef.current === "preview") {
      refreshHoveredAnchor(editor, hoverTargetRef.current, dispatch);
    }
  };

  const scheduleLinkEditorUpdate = useEffectEvent(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    });
  });

  useEffect(
    () =>
      mergeRegister(
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
              payload: {
                editedLinkText: readSelectedLinkText(),
                editedLinkUrl: readSelectedLinkUrl() || LINK_PLACEHOLDER_URL,
              },
              type: "open-edit-mode",
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
              dispatch({ type: "close-link-editor" });
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
              return true;
            }

            const selection = $getSelection();
            const selectedText = $isRangeSelection(selection)
              ? selection.getTextContent()
              : "";

            dispatch({
              payload: {
                editedLinkText: selectedText,
                editedLinkUrl: LINK_PLACEHOLDER_URL,
              },
              type: "open-edit-mode",
            });
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
            return true;
          },
          COMMAND_PRIORITY_HIGH
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            if (surfaceRef.current === "closed") {
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
              const safeUrl = sanitizeEditorLinkUrl(linkNode.getURL());
              if (safeUrl !== "about:blank") {
                window.open(safeUrl, "_blank", "noopener,noreferrer");
              }
              return true;
            }

            return false;
          },
          COMMAND_PRIORITY_LOW
        )
      ),
    [editor]
  );

  // Owns the scheduled animation frame symmetrically: schedule on mount,
  // cancel AND clear on unmount so StrictMode double-mount stays clean.
  useEffect(() => {
    scheduleLinkEditorUpdate();
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

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
  }, []);

  useEditCardCloseSelectionReconcile(editor, surface);

  useEffect(() => {
    if (!(state.isLinkEditMode && urlInputRef.current)) {
      return;
    }

    urlInputRef.current.focus();
    urlInputRef.current.select();
  }, [state.isLinkEditMode]);

  const handleInputRef = (element: HTMLInputElement | null) => {
    urlInputRef.current = element;
  };

  // Virtual anchor (floating-ui) around the live surface rect.
  const anchorElement = useMemo(
    () =>
      anchor === null
        ? null
        : {
            getBoundingClientRect: () =>
              new DOMRect(anchor.left, anchor.top, anchor.width, anchor.height),
          },
    [anchor]
  );

  if (surface === "closed" || anchorElement === null) {
    return null;
  }

  return (
    <FloatingLinkEditorSurfaces
      anchorElement={anchorElement}
      dispatch={dispatch}
      editor={editor}
      onInputRef={handleInputRef}
      onPointerOverChipChange={handlePointerOverChipChange}
      state={state}
    />
  );
}
