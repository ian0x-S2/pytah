"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PlusIcon } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BLOCK_ICONS,
  BLOCK_TYPE_ORDER,
  getAvailableBlockOptions,
  INSERT_ACTION_ORDER,
  INSERT_SECTION_TYPES,
} from "../block-type-toolbar/options";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { applyBlockType } from "../block-type-toolbar/utils";
import { getSlashRunner } from "../slash-command/executors";
import type { FullToolbarUiAction } from "./types";

interface InsertPopoverProps {
  activeInsertIndex: number;
  /**
   * Slash command ids resolved from the enabled feature set. Feature-gated
   * actions only render when their id is present. When omitted, every
   * insert action renders.
   */
  commandIds?: readonly string[];
  dispatchUi: (action: FullToolbarUiAction) => void;
  insertOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InsertPopover = memo(function InsertPopover({
  activeInsertIndex,
  commandIds,
  dispatchUi,
  insertOpen,
  onOpenChange,
}: InsertPopoverProps) {
  const [editor] = useLexicalComposerContext();
  const insertOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const availableOptions = getAvailableBlockOptions(
    commandIds ?? BLOCK_TYPE_ORDER
  );
  const insertOptions = availableOptions
    .filter((option) => INSERT_SECTION_TYPES.has(option.value))
    .sort(
      (a, b) =>
        INSERT_ACTION_ORDER.indexOf(a.value) -
        INSERT_ACTION_ORDER.indexOf(b.value)
    );

  const close = () => {
    dispatchUi({ type: "set-insert-open", payload: { open: false } });
  };

  const handleSelect = (value: BlockTypeValue) => {
    close();

    if (INSERT_SECTION_TYPES.has(value)) {
      getSlashRunner(value)?.(editor);
      return;
    }

    applyBlockType(editor, value);
  };

  const insertActions = insertOptions.map((option) => ({
    key: option.value,
    label: option.label,
    onSelect: () => {
      handleSelect(option.value);
    },
  }));

  const focusInsertOption = (index: number) => {
    const optionCount = insertActions.length;
    if (optionCount === 0) {
      return;
    }
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
          {insertOptions.map((option, optionIndex) => {
            const Icon = BLOCK_ICONS[option.value];
            const isActive = optionIndex === activeInsertIndex;

            return (
              <button
                aria-selected={isActive}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  isActive && "bg-accent"
                )}
                key={option.value}
                onClick={() => handleSelect(option.value)}
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
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});
