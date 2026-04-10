"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_CRITICAL,
  isDOMNode,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableActionMenu } from "./menu";
import { DEFAULT_SELECTION_COUNTS, readTableMenuContext } from "./selection";
import type { ButtonPosition, SelectionCounts } from "./types";

function TableCellActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ButtonPosition>({ left: 0, top: 0 });
  const [selectionCounts, setSelectionCounts] = useState<SelectionCounts>(
    DEFAULT_SELECTION_COUNTS
  );

  const updateMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);
      if (!context) {
        setIsVisible(false);
        setIsMenuOpen(false);
        setSelectionCounts(DEFAULT_SELECTION_COUNTS);
        return;
      }

      setPosition(context.position);
      setSelectionCounts(context.selectionCounts);
      setIsVisible(true);
    });
  }, [anchorElem, editor]);

  useEffect(() => {
    const onPointerUp = () => {
      window.setTimeout(updateMenu, 0);
    };

    updateMenu();

    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateMenu();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateMenu();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerRootListener((rootElement, previousRootElement) => {
        previousRootElement?.removeEventListener("pointerup", onPointerUp);
        rootElement?.addEventListener("pointerup", onPointerUp);
      })
    );
  }, [editor, updateMenu]);

  useEffect(() => {
    window.addEventListener("resize", updateMenu);
    window.addEventListener("scroll", updateMenu, true);

    return () => {
      window.removeEventListener("resize", updateMenu);
      window.removeEventListener("scroll", updateMenu, true);
    };
  }, [updateMenu]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target && isDOMNode(target))) {
        return;
      }

      const menuRoot = anchorElem.querySelector(
        "[data-table-actions-root='true']"
      );
      if (menuRoot?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [anchorElem, isMenuOpen]);

  return createPortal(
    <div
      className={
        isVisible ? "absolute z-40" : "pointer-events-none absolute z-40 hidden"
      }
      data-table-actions-root="true"
      style={{ left: position.left, top: position.top }}
    >
      <Popover onOpenChange={setIsMenuOpen} open={isMenuOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label="Open table actions"
              className="size-5"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              size="icon-xs"
              variant="outline"
            />
          }
        >
          <ChevronDownIcon className="size-2.5" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-56 p-0"
          side="right"
          sideOffset={8}
        >
          <TableActionMenu
            onClose={() => setIsMenuOpen(false)}
            selectionCounts={selectionCounts}
          />
        </PopoverContent>
      </Popover>
    </div>,
    anchorElem
  );
}

export function TableBehaviorPlugin() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      setAnchorElem(rootElement?.parentElement ?? null);
    });
  }, [editor]);

  return (
    <>
      <TablePlugin hasCellBackgroundColor={false} hasHorizontalScroll />
      {isEditable && anchorElem ? (
        <TableCellActionMenuContainer anchorElem={anchorElem} />
      ) : null}
    </>
  );
}
