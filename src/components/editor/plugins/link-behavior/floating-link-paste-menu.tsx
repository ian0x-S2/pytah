"use client";

import { COMMAND_PRIORITY_HIGH, KEY_DOWN_COMMAND } from "lexical";
import type { LexicalEditor } from "lexical";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { LINK_PASTE_OPTIONS } from "./constants";
import type { LinkPasteOptionId } from "./constants";
import type { FloatingLinkEditorAnchor } from "./floating-link-editor-position";
import { executeLinkPasteOption } from "./floating-link-paste-actions";
import { FloatingLinkPasteItems } from "./floating-link-paste-items";

interface FloatingLinkPasteMenuProps {
  anchor: FloatingLinkEditorAnchor | null;
  editor: LexicalEditor;
  isOpen: boolean;
  linkNodeKey: string | null;
  onClose: () => void;
  url: string;
}

export function FloatingLinkPasteMenu({
  anchor,
  editor,
  isOpen,
  linkNodeKey,
  onClose,
  url,
}: FloatingLinkPasteMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const handleNavigate = (index: number, shouldFocus = true) => {
    selectedIndexRef.current = index;
    setSelectedIndex(index);
    if (shouldFocus) {
      itemRefs.current[index]?.focus();
    }
  };

  const handleSelectOption = (optionId: LinkPasteOptionId) => {
    if (linkNodeKey) {
      executeLinkPasteOption(editor, linkNodeKey, url, optionId);
    }

    selectedIndexRef.current = 0;
    setSelectedIndex(0);
    onClose();
    editor.focus();
  };

  const onEditorKeyDown = useEffectEvent(
    (
      command: "arrow-down" | "arrow-up" | "enter" | "escape" | "tab",
      shiftKey = false
    ) => {
      const { current } = selectedIndexRef;
      const count = LINK_PASTE_OPTIONS.length;

      switch (command) {
        case "arrow-down": {
          const next = (current + 1) % count;
          handleNavigate(next, true);
          break;
        }
        case "arrow-up": {
          const next = (current - 1 + count) % count;
          handleNavigate(next, true);
          break;
        }
        case "tab": {
          const direction = shiftKey ? -1 : 1;
          const next = (current + direction + count) % count;
          handleNavigate(next, true);
          break;
        }
        case "enter": {
          const selected = LINK_PASTE_OPTIONS[current];
          if (selected) {
            handleSelectOption(selected.id);
          }
          break;
        }
        case "escape": {
          onClose();
          editor.focus();
          break;
        }
        default: {
          break;
        }
      }
    }
  );

  const onEditorDismiss = useEffectEvent(() => {
    onClose();
  });

  // Keyboard navigation from editor caret
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (!isOpen) {
          return false;
        }

        switch (event.key) {
          case "ArrowDown": {
            event.preventDefault();
            onEditorKeyDown("arrow-down");
            return true;
          }
          case "ArrowUp": {
            event.preventDefault();
            onEditorKeyDown("arrow-up");
            return true;
          }
          case "Tab": {
            event.preventDefault();
            onEditorKeyDown("tab", event.shiftKey);
            return true;
          }
          case "Enter": {
            event.preventDefault();
            onEditorKeyDown("enter");
            return true;
          }
          case "Escape": {
            event.preventDefault();
            onEditorKeyDown("escape");
            return true;
          }
          default: {
            if (
              event.key.length === 1 ||
              event.key === "Backspace" ||
              event.key === "Delete"
            ) {
              onEditorDismiss();
            }
            return false;
          }
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, isOpen]);

  // Keyboard navigation within the popover surface
  const handlePopoverKeyDown = (event: React.KeyboardEvent) => {
    const { current } = selectedIndexRef;
    const count = LINK_PASTE_OPTIONS.length;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = (current + 1) % count;
        handleNavigate(next, true);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const next = (current - 1 + count) % count;
        handleNavigate(next, true);
        break;
      }
      case "Home": {
        event.preventDefault();
        handleNavigate(0, true);
        break;
      }
      case "End": {
        event.preventDefault();
        handleNavigate(count - 1, true);
        break;
      }
      case "Tab": {
        event.preventDefault();
        const direction = event.shiftKey ? -1 : 1;
        const next = (current + direction + count) % count;
        handleNavigate(next, true);
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const selected = LINK_PASTE_OPTIONS[current];
        if (selected) {
          handleSelectOption(selected.id);
        }
        break;
      }
      case "Escape": {
        event.preventDefault();
        onClose();
        editor.focus();
        break;
      }
      default: {
        if (
          event.key.length === 1 ||
          event.key === "Backspace" ||
          event.key === "Delete"
        ) {
          onClose();
          editor.focus();
        }
        break;
      }
    }
  };

  if (!isOpen || !anchor) {
    return null;
  }

  const anchorElement = {
    getBoundingClientRect: () =>
      new DOMRect(anchor.left, anchor.top, anchor.width, anchor.height),
  };

  return (
    <Popover
      modal={false}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <PopoverContent
        align="start"
        anchor={anchorElement}
        aria-activedescendant={`${menuId}-item-${selectedIndex}`}
        aria-label="Link paste options"
        className={cn(
          "editor-floating z-50 flex w-64 origin-(--transform-origin) flex-col gap-0.5 overflow-hidden rounded-md border border-border p-1 text-sm shadow-lg ring-1 ring-border outline-hidden duration-100 fade-in-0 select-none zoom-in-95"
        )}
        finalFocus={false}
        id={menuId}
        initialFocus={false}
        onKeyDown={handlePopoverKeyDown}
        onPointerDown={(event) => {
          // Prevent losing selection in editor on click
          event.preventDefault();
        }}
        role="menu"
        side="bottom"
        sideOffset={6}
      >
        <FloatingLinkPasteItems
          itemRefs={itemRefs}
          menuId={menuId}
          onNavigate={handleNavigate}
          onSelectOption={handleSelectOption}
          selectedIndex={selectedIndex}
        />
      </PopoverContent>
    </Popover>
  );
}
