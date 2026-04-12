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
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableActionMenu } from "./menu";
import {
  areSelectionCountsEqual,
  DEFAULT_SELECTION_COUNTS,
  readTableMenuContext,
} from "./selection";
import type {
  ButtonPosition,
  SelectionCounts,
  TableMenuContext,
} from "./types";

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
  const isMenuOpenRef = useRef(false);
  const isMenuClosingRef = useRef(false);
  const activeCellKeyRef = useRef<TableMenuContext["cellKey"] | null>(null);

  const setMenuOpen = useCallback((open: boolean) => {
    isMenuOpenRef.current = open;
    setIsMenuOpen(open);
  }, []);

  const applyMenuContext = useCallback((context: TableMenuContext) => {
    activeCellKeyRef.current = context.cellKey;
    setPosition((currentPosition) => {
      return currentPosition.left === context.position.left &&
        currentPosition.top === context.position.top
        ? currentPosition
        : context.position;
    });
    setSelectionCounts((currentCounts) => {
      return areSelectionCountsEqual(currentCounts, context.selectionCounts)
        ? currentCounts
        : context.selectionCounts;
    });
    setIsVisible((currentIsVisible) =>
      currentIsVisible ? currentIsVisible : true
    );
  }, []);

  const hideMenu = useCallback(() => {
    activeCellKeyRef.current = null;
    setIsVisible((currentIsVisible) =>
      currentIsVisible ? false : currentIsVisible
    );
    setSelectionCounts((currentCounts) => {
      return areSelectionCountsEqual(currentCounts, DEFAULT_SELECTION_COUNTS)
        ? currentCounts
        : DEFAULT_SELECTION_COUNTS;
    });
  }, []);

  const closeMenuAtCurrentPosition = useCallback(() => {
    isMenuClosingRef.current = true;
    setMenuOpen(false);
  }, [setMenuOpen]);

  const syncMenuToSelection = useCallback(() => {
    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);

      if (!context) {
        hideMenu();
        return;
      }

      applyMenuContext(context);
    });
  }, [anchorElem, applyMenuContext, editor, hideMenu]);

  const updateMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);

      if (isMenuClosingRef.current) {
        return;
      }

      if (!context) {
        if (isMenuOpenRef.current) {
          closeMenuAtCurrentPosition();
          return;
        }

        hideMenu();
        return;
      }

      if (
        isMenuOpenRef.current &&
        activeCellKeyRef.current &&
        context.cellKey !== activeCellKeyRef.current
      ) {
        closeMenuAtCurrentPosition();
        return;
      }

      applyMenuContext(context);
    });
  }, [
    anchorElem,
    applyMenuContext,
    closeMenuAtCurrentPosition,
    editor,
    hideMenu,
  ]);

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

      closeMenuAtCurrentPosition();
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [anchorElem, closeMenuAtCurrentPosition, isMenuOpen]);

  return createPortal(
    <div
      className={
        isVisible
          ? "absolute z-40"
          : "pointer-events-none invisible absolute z-40"
      }
      data-table-actions-root="true"
      style={{ left: position.left, top: position.top }}
    >
      <Popover
        onOpenChange={(open) => {
          setMenuOpen(open);

          if (open) {
            isMenuClosingRef.current = false;
            return;
          }

          isMenuClosingRef.current = true;
        }}
        onOpenChangeComplete={(open) => {
          if (open) {
            return;
          }

          isMenuClosingRef.current = false;
          syncMenuToSelection();
        }}
        open={isMenuOpen}
      >
        <PopoverTrigger
          render={
            <Button
              aria-label="Open table actions"
              className="size-5"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
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
            onClose={closeMenuAtCurrentPosition}
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
