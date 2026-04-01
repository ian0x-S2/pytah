import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  Edit3Icon,
  ExternalLinkIcon,
  Link2Icon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  clearToolbarLink,
  submitToolbarLink,
} from "../floating-toolbar/actions";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../floating-toolbar/link-command";
import {
  getFloatingToolbarSelectedNode,
  getSelectedLinkNode,
  isSelectionWithinSingleLink,
} from "../floating-toolbar/selection";
import { LINK_PLACEHOLDER_URL, sanitizeEditorLinkUrl } from "./utils";

interface FloatingLinkEditorPosition {
  left: number;
  top: number;
}

const LINK_EDITOR_OFFSET = 12;
const EMPTY_POSITION: FloatingLinkEditorPosition = { left: 0, top: 0 };

const getLinkEditorPosition = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): FloatingLinkEditorPosition | null => {
  const selection = $getSelection();
  const nativeSelection = window.getSelection();
  const rootElement = editor.getRootElement();

  if (!(selection && rootElement && editor.isEditable())) {
    return null;
  }

  let rectangle: DOMRect | null = null;

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    const element = node ? editor.getElementByKey(node.getKey()) : null;
    rectangle = element?.getBoundingClientRect() ?? null;
  } else if (
    nativeSelection &&
    rootElement.contains(nativeSelection.anchorNode)
  ) {
    rectangle =
      nativeSelection.focusNode?.parentElement?.getBoundingClientRect() ??
      nativeSelection.getRangeAt(0).getBoundingClientRect();
  }

  if (!rectangle) {
    return null;
  }

  return {
    left: rectangle.left,
    top: rectangle.bottom + LINK_EDITOR_OFFSET,
  };
};

const readSelectedLinkUrl = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    if (!isSelectionWithinSingleLink(selection)) {
      return "";
    }

    return (
      getSelectedLinkNode(
        getFloatingToolbarSelectedNode(selection)
      )?.getURL() ?? ""
    );
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return node ? (getSelectedLinkNode(node)?.getURL() ?? "") : "";
  }

  return "";
};

const selectionContainsLink = () => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    return isSelectionWithinSingleLink(selection);
  }

  if ($isNodeSelection(selection)) {
    const [node] = selection.getNodes();
    return Boolean(node && getSelectedLinkNode(node));
  }

  return false;
};

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

  const updateLinkEditor = useCallback(() => {
    const nextIsLink = selectionContainsLink();
    const nextLinkUrl = nextIsLink ? readSelectedLinkUrl() : "";
    const nextPosition = getLinkEditorPosition(editor);

    setIsLink(nextIsLink);
    setLinkUrl(nextLinkUrl);

    if (!isLinkEditMode) {
      setEditedLinkUrl(nextLinkUrl || LINK_PLACEHOLDER_URL);
    }

    if (nextPosition) {
      setPosition(nextPosition);
      return;
    }

    setIsLinkEditMode(false);
  }, [editor, isLinkEditMode]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_FLOATING_LINK_EDITOR_COMMAND,
        () => {
          setIsLinkEditMode(true);
          setEditedLinkUrl(readSelectedLinkUrl() || LINK_PLACEHOLDER_URL);
          updateLinkEditor();
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
  }, [editor, isLink, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isLinkEditMode) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isLinkEditMode]);

  useEffect(() => {
    const handleWindowChange = () => {
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [editor, updateLinkEditor]);

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
      <div
        className={cn(
          "flex min-w-72 items-center gap-2 rounded-lg bg-popover p-2 shadow-md ring-1 ring-foreground/10",
          "fade-in-0 zoom-in-95 animate-in duration-100"
        )}
      >
        {isLinkEditMode ? (
          <>
            <Input
              className="h-8 min-w-56 text-xs"
              onChange={(event) => setEditedLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitToolbarLink(editor, editedLinkUrl);
                  setIsLinkEditMode(false);
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsLinkEditMode(false);
                }
              }}
              ref={inputRef}
              value={editedLinkUrl}
            />
            <Button
              onClick={() => {
                submitToolbarLink(editor, editedLinkUrl);
                setIsLinkEditMode(false);
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Link2Icon />
            </Button>
            <Button
              onClick={() => setIsLinkEditMode(false)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <XIcon />
            </Button>
          </>
        ) : (
          <>
            <a
              className="max-w-64 truncate text-primary text-xs underline underline-offset-4"
              href={sanitizeEditorLinkUrl(linkUrl)}
              rel="noopener noreferrer"
              target="_blank"
            >
              {linkUrl}
            </a>
            <Button
              onClick={(event) => {
                event.preventDefault();
                setEditedLinkUrl(linkUrl || LINK_PLACEHOLDER_URL);
                setIsLinkEditMode(true);
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Edit3Icon />
            </Button>
            <Button
              onClick={() => {
                clearToolbarLink(editor);
                setIsLinkEditMode(false);
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Trash2Icon />
            </Button>
            <Button
              onClick={() => {
                window.open(
                  sanitizeEditorLinkUrl(linkUrl),
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <ExternalLinkIcon />
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
