"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND } from "lexical";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TableActionMenu } from "./menu";
import {
  areSelectionCountsEqual,
  DEFAULT_SELECTION_COUNTS,
  readTableMenuContext,
  resolveNextMenuIndex,
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
  const pointerUpTimeoutRef = useRef<number | null>(null);
  const viewportRafRef = useRef<number | null>(null);

  const setMenuOpen = (open: boolean) => {
    isMenuOpenRef.current = open;
    setIsMenuOpen(open);
  };

  const applyMenuContext = (context: TableMenuContext) => {
    activeCellKeyRef.current = context.cellKey;
    setPosition((currentPosition) =>
      currentPosition.left === context.position.left &&
      currentPosition.top === context.position.top
        ? currentPosition
        : context.position
    );
    setSelectionCounts((currentCounts) =>
      areSelectionCountsEqual(currentCounts, context.selectionCounts)
        ? currentCounts
        : context.selectionCounts
    );
    setIsVisible(true);
  };

  const hideMenu = () => {
    activeCellKeyRef.current = null;
    setIsVisible((currentIsVisible) =>
      currentIsVisible ? false : currentIsVisible
    );
    setSelectionCounts((currentCounts) =>
      areSelectionCountsEqual(currentCounts, DEFAULT_SELECTION_COUNTS)
        ? currentCounts
        : DEFAULT_SELECTION_COUNTS
    );
  };

  const closeMenuAtCurrentPosition = () => {
    isMenuClosingRef.current = true;
    setMenuOpen(false);
  };

  const syncMenuToSelection = () => {
    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);

      if (!context) {
        hideMenu();
        return;
      }

      applyMenuContext(context);
    });
  };

  const updateMenu = useEffectEvent(() => {
    if (isMenuClosingRef.current) {
      return;
    }

    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);

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
  });

  useEffect(() => {
    const onPointerUp = () => {
      if (pointerUpTimeoutRef.current !== null) {
        window.clearTimeout(pointerUpTimeoutRef.current);
      }
      pointerUpTimeoutRef.current = window.setTimeout(() => {
        pointerUpTimeoutRef.current = null;
        updateMenu();
      }, 0);
    };

    updateMenu();

    const unregister = mergeRegister(
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

    return () => {
      if (pointerUpTimeoutRef.current !== null) {
        window.clearTimeout(pointerUpTimeoutRef.current);
        pointerUpTimeoutRef.current = null;
      }
      unregister();
    };
  }, [editor]);

  useEffect(() => {
    const handleViewportChange = () => {
      if (viewportRafRef.current !== null) {
        return;
      }
      viewportRafRef.current = window.requestAnimationFrame(() => {
        viewportRafRef.current = null;
        updateMenu();
      });
    };

    window.addEventListener("resize", handleViewportChange, { passive: true });
    window.addEventListener("scroll", handleViewportChange, {
      capture: true,
      passive: true,
    });

    return () => {
      if (viewportRafRef.current !== null) {
        window.cancelAnimationFrame(viewportRafRef.current);
        viewportRafRef.current = null;
      }
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, []);

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
      <DropdownMenu
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
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Open table actions"
              className="size-5"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  editor.focus();
                }
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              size="icon-xs"
              variant="outline"
            />
          }
        >
          <ChevronDownIcon aria-hidden className="size-2.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="editor-table-menu w-56"
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault();
              const items = [
                ...event.currentTarget.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]:not([aria-disabled="true"])'
                ),
              ];
              if (items.length === 0) {
                return;
              }
              const currentIndex = items.indexOf(
                document.activeElement as HTMLElement
              );
              const nextIndex = resolveNextMenuIndex(
                currentIndex,
                items.length,
                event.shiftKey
              );
              items[nextIndex]?.focus();
            }
          }}
          side="right"
          sideOffset={8}
        >
          <TableActionMenu
            onClose={closeMenuAtCurrentPosition}
            selectionCounts={selectionCounts}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>,
    anchorElem
  );
}

export function TableBehaviorPlugin() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  useEffect(
    () =>
      editor.registerRootListener((rootElement) => {
        setAnchorElem(rootElement?.parentElement ?? null);
      }),
    [editor]
  );

  return (
    <>
      <TablePlugin hasCellBackgroundColor={false} hasHorizontalScroll />
      {isEditable && anchorElem ? (
        <TableCellActionMenuContainer anchorElem={anchorElem} />
      ) : null}
    </>
  );
}
