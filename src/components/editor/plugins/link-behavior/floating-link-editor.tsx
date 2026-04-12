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
import { useCallback, useEffect, useRef, useState } from "react";
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

export function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isLink, setIsLink] = useState(false);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [editedLinkUrl, setEditedLinkUrl] = useState(LINK_PLACEHOLDER_URL);
  const [position, setPosition] =
    useState<FloatingLinkEditorPosition>(EMPTY_POSITION);
  const animationFrameRef = useRef<number | null>(null);

  const updateLinkEditor = useCallback(() => {
    const nextIsLink = selectionContainsLink();
    const nextLinkUrl = nextIsLink ? readSelectedLinkUrl() : "";
    const nextPosition = getLinkEditorPosition(editor);

    setIsLink((currentIsLink) =>
      currentIsLink === nextIsLink ? currentIsLink : nextIsLink
    );
    setLinkUrl((currentLinkUrl) =>
      currentLinkUrl === nextLinkUrl ? currentLinkUrl : nextLinkUrl
    );

    if (!isLinkEditMode) {
      const nextEditedLinkUrl = nextLinkUrl || LINK_PLACEHOLDER_URL;
      setEditedLinkUrl((currentEditedLinkUrl) =>
        currentEditedLinkUrl === nextEditedLinkUrl
          ? currentEditedLinkUrl
          : nextEditedLinkUrl
      );
    }

    if (nextPosition) {
      setPosition((currentPosition) => {
        return areFloatingToolbarPositionsEqual(currentPosition, nextPosition)
          ? currentPosition
          : nextPosition;
      });
      return;
    }

    setPosition((currentPosition) => {
      return areFloatingToolbarPositionsEqual(currentPosition, EMPTY_POSITION)
        ? currentPosition
        : EMPTY_POSITION;
    });
    setIsLinkEditMode((currentIsLinkEditMode) =>
      currentIsLinkEditMode ? false : currentIsLinkEditMode
    );
  }, [editor, isLinkEditMode]);

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
          setIsLinkEditMode(true);
          setEditedLinkUrl(readSelectedLinkUrl() || LINK_PLACEHOLDER_URL);
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
            setIsLinkEditMode(false);
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            return true;
          }

          setIsLinkEditMode(true);
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

          setIsLink(false);
          setIsLinkEditMode(false);
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
    if (isLinkEditMode) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isLinkEditMode]);

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
        setIsLink(false);
        setIsLinkEditMode(false);
      }
    };

    floatingElement.addEventListener("focusout", handleFocusOut);
    return () => {
      floatingElement.removeEventListener("focusout", handleFocusOut);
    };
  }, [isLink]);

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
        inputRef={inputRef}
        isLinkEditMode={isLinkEditMode}
        linkUrl={linkUrl}
        onEditedLinkUrlChange={setEditedLinkUrl}
        onRequestCloseEditMode={() => setIsLinkEditMode(false)}
        onRequestEditMode={() => {
          setEditedLinkUrl(linkUrl || LINK_PLACEHOLDER_URL);
          setIsLinkEditMode(true);
        }}
      />
    </div>,
    document.body
  );
}
