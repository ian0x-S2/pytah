"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PlusIcon, TypeIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  useEditorCommands,
  useEditorResolvedCommands,
} from "../../core/editor-commands-context";
import {
  BLOCK_ICONS,
  getAvailableBlockOptions,
  INSERT_ACTION_ORDER,
  INSERT_SECTION_TYPES,
} from "../block-type-toolbar/options";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { applyBlockType } from "../block-type-toolbar/utils";
import { getCoreSlashRunner } from "../slash-command/executors";
import { runToolbarInsert } from "../slash-command/utils";
import type { FullToolbarUiAction } from "./types";

interface InsertPopoverProps {
  activeInsertIndex: number;
  /** Optional explicit command id allowlist; defaults to editor context. */
  commandIds?: readonly string[];
  dispatchUi: (action: FullToolbarUiAction) => void;
  insertOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsertPopover({
  activeInsertIndex,
  commandIds,
  dispatchUi,
  insertOpen,
  onOpenChange,
}: InsertPopoverProps) {
  const [editor] = useLexicalComposerContext();
  const contextCommandIds = useEditorResolvedCommands();
  const editorCommands = useEditorCommands();
  const insertOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const resolvedCommandIds = commandIds ?? contextCommandIds;
  const availableOptions = getAvailableBlockOptions(
    resolvedCommandIds,
    editorCommands
  );
  const insertOptions = availableOptions
    .filter((option) => INSERT_SECTION_TYPES.has(option.value))
    .toSorted(
      (a, b) =>
        INSERT_ACTION_ORDER.indexOf(a.value) -
        INSERT_ACTION_ORDER.indexOf(b.value)
    );

  const close = () => {
    dispatchUi({ payload: { open: false }, type: "set-insert-open" });
  };

  const handleSelect = (value: BlockTypeValue) => {
    close();

    const runner =
      editorCommands.find((entry) => entry.command.id === value)?.run ??
      getCoreSlashRunner(value);

    if (INSERT_SECTION_TYPES.has(value)) {
      if (runner) {
        runToolbarInsert(editor, runner);
      }
      return;
    }

    applyBlockType(editor, value, runner);
  };

  const focusInsertOption = (index: number) => {
    const optionCount = insertOptions.length;
    if (optionCount === 0) {
      return;
    }
    const nextIndex = (index + optionCount) % optionCount;

    dispatchUi({ payload: nextIndex, type: "set-active-insert-index" });
    insertOptionRefs.current[nextIndex]?.focus();
  };

  // Focus the first item only when the menu opens (never on passive hover).
  useEffect(() => {
    if (!insertOpen) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      insertOptionRefs.current[0]?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [insertOpen]);

  const handleInsertMenuKeyDown = (
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
        focusInsertOption(insertOptions.length - 1);
        return;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = insertOptions[activeInsertIndex];
        if (option) {
          handleSelect(option.value);
        }
        break;
      }
      default: {
        break;
      }
    }
  };

  if (insertOptions.length === 0) {
    return null;
  }

  return (
    <Popover onOpenChange={onOpenChange} open={insertOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label="Insert"
            className="h-7 gap-1.5 rounded-md text-xs"
            size="sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <PlusIcon aria-hidden className="size-3.5" />
        <span>Insert</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="editor-floating w-44 p-1">
        <div
          aria-label="Insert blocks"
          className="space-y-1"
          onKeyDown={handleInsertMenuKeyDown}
          role="menu"
        >
          {insertOptions.map((option, optionIndex) => {
            const Icon = option.icon ?? BLOCK_ICONS[option.value] ?? TypeIcon;
            const isActive = optionIndex === activeInsertIndex;

            return (
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors outline-none select-none focus-visible:outline-none",
                  isActive && "bg-accent text-accent-foreground"
                )}
                key={option.value}
                onClick={() => handleSelect(option.value)}
                onFocus={() =>
                  dispatchUi({
                    payload: optionIndex,
                    type: "set-active-insert-index",
                  })
                }
                onMouseEnter={() =>
                  dispatchUi({
                    payload: optionIndex,
                    type: "set-active-insert-index",
                  })
                }
                ref={(element) => {
                  insertOptionRefs.current[optionIndex] = element;
                }}
                role="menuitem"
                tabIndex={optionIndex === activeInsertIndex ? 0 : -1}
                type="button"
              >
                <Icon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
