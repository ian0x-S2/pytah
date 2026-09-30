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
import { useEffect, useEffectEvent, useMemo, useReducer, useRef } from "react";

import { Popover, PopoverContent } from "@/components/ui/popover";

import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../floating-toolbar/link-command";
import { getFloatingToolbarSelectedNode } from "../floating-toolbar/selection";
import { FloatingLinkEditorPanel } from "./floating-link-editor-panel";
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
import { LINK_PLACEHOLDER_URL } from "./utils";

export function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext();
  const animationFrameRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(
    floatingLinkEditorReducer,
    FLOATING_LINK_EDITOR_INITIAL_STATE
  );
  const {
    anchor,
    editedLinkText,
    editedLinkUrl,
    isLink,
    isLinkEditMode,
    linkUrl,
  } = state;

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

            dispatch({
              payload: { editedLinkUrl: LINK_PLACEHOLDER_URL },
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
      ),
    [editor, isLink]
  );

  // Owns the scheduled animation frame symmetrically: schedule on mount,
  // cancel AND clear on unmount. If the ref is left pointing at a cancelled
  // frame, StrictMode's double-mount poisons the early-return guard in
  // scheduleLinkEditorUpdate forever — syncs stop running and the editor
  // never detects a selected link.
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

  const handleInputRef = (element: HTMLInputElement | null) => {
    if (!(element && isLinkEditMode)) {
      return;
    }

    element.focus();
    element.select();
  };

  // Virtual anchor (floating-ui) around the live selection rect. Base UI
  // re-measures it on scroll/resize; the plugin also re-syncs on those
  // events so the snapshot follows the text.
  const anchorElement = useMemo(
    () =>
      anchor === null
        ? null
        : {
            getBoundingClientRect: () => anchor,
          },
    [anchor]
  );

  if (!isLink || anchorElement === null) {
    return null;
  }

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          dispatch({ type: "close-link-editor" });
        }
      }}
      open
    >
      <PopoverContent
        align="start"
        anchor={anchorElement}
        className="editor-floating editor-floating-padding-md"
        initialFocus={false}
        side="bottom"
        sideOffset={6}
      >
        <FloatingLinkEditorPanel
          editedLinkText={editedLinkText}
          editedLinkUrl={editedLinkUrl}
          editor={editor}
          inputRef={handleInputRef}
          isLinkEditMode={isLinkEditMode}
          linkUrl={linkUrl}
          onEditedLinkTextChange={(value) =>
            dispatch({ payload: value, type: "set-edited-link-text" })
          }
          onEditedLinkUrlChange={(value) =>
            dispatch({ payload: value, type: "set-edited-link-url" })
          }
          onRequestClose={() => dispatch({ type: "close-link-editor" })}
        />
      </PopoverContent>
    </Popover>
  );
}
