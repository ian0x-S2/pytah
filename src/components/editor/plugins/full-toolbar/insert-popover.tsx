"use client";

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { ChevronDownIcon, PlusIcon, TableIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { INSERT_COLLAPSIBLE_COMMAND } from "../collapsible/commands";
import { DEFAULT_INSERT_TABLE_PAYLOAD } from "../table-behavior/constants";
import type { FullToolbarUiAction } from "./types";

interface InsertPopoverProps {
  activeInsertIndex: number;
  dispatchUi: (action: FullToolbarUiAction) => void;
  insertOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsertPopover({
  activeInsertIndex,
  dispatchUi,
  insertOpen,
  onOpenChange,
}: InsertPopoverProps) {
  const [editor] = useLexicalComposerContext();
  const insertOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const insertTable = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, DEFAULT_INSERT_TABLE_PAYLOAD);
    dispatchUi({ type: "set-insert-open", payload: { open: false } });
  };

  const insertDivider = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    dispatchUi({ type: "set-insert-open", payload: { open: false } });
  };

  const insertCollapsible = () => {
    editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
    dispatchUi({ type: "set-insert-open", payload: { open: false } });
  };

  const insertActions = [
    {
      icon: <TableIcon className="size-4 text-muted-foreground" />,
      label: "Table",
      onSelect: insertTable,
    },
    {
      icon: (
        <span className="flex size-4 items-center justify-center text-muted-foreground">
          -
        </span>
      ),
      label: "Divider",
      onSelect: insertDivider,
    },
    {
      icon: <ChevronDownIcon className="size-4 text-muted-foreground" />,
      label: "Collapsible",
      onSelect: insertCollapsible,
    },
  ];

  const focusInsertOption = (index: number) => {
    const optionCount = insertActions.length;
    const nextIndex = (index + optionCount) % optionCount;

    dispatchUi({ type: "set-active-insert-index", payload: nextIndex });
    insertOptionRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    if (!insertOpen) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      insertOptionRefs.current[activeInsertIndex]?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeInsertIndex, insertOpen]);

  const handleInsertListKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        focusInsertOption(activeInsertIndex + 1);
        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        focusInsertOption(activeInsertIndex - 1);
        return;
      }
      case "Home": {
        event.preventDefault();
        focusInsertOption(0);
        return;
      }
      case "End": {
        event.preventDefault();
        focusInsertOption(insertActions.length - 1);
        return;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        insertActions[activeInsertIndex]?.onSelect();
        return;
      }
      default: {
        return;
      }
    }
  };

  return (
    <Popover onOpenChange={onOpenChange} open={insertOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label="Insert"
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs"
            size="sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <PlusIcon className="size-3.5" />
        <span>Insert</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1">
        <div
          className="space-y-0.5"
          onKeyDown={handleInsertListKeyDown}
          role="listbox"
        >
          {insertActions.map((action, optionIndex) => {
            const isActive = optionIndex === activeInsertIndex;

            return (
              <button
                aria-selected={isActive}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  isActive && "bg-accent"
                )}
                key={action.label}
                onClick={action.onSelect}
                onFocus={() =>
                  dispatchUi({
                    type: "set-active-insert-index",
                    payload: optionIndex,
                  })
                }
                onMouseEnter={() =>
                  dispatchUi({
                    type: "set-active-insert-index",
                    payload: optionIndex,
                  })
                }
                ref={(element) => {
                  insertOptionRefs.current[optionIndex] = element;
                }}
                role="option"
                tabIndex={optionIndex === activeInsertIndex ? 0 : -1}
                type="button"
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
