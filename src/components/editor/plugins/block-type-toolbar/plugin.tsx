"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  CheckIcon,
  ChevronDownIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  RedoIcon,
  UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_OPTIONS } from "./options";
import type { BlockTypeValue } from "./types";
import {
  applyBlockType,
  getBlockTypeFromSelection,
  getCurrentBlockOption,
} from "./utils";

export function BlockTypeToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [currentBlockType, setCurrentBlockType] =
    useState<BlockTypeValue>("paragraph");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const currentOption = useMemo(() => {
    return getCurrentBlockOption(currentBlockType, BLOCK_OPTIONS);
  }, [currentBlockType]);

  const updateCurrentBlockType = useCallback(() => {
    editor.getEditorState().read(() => {
      const blockType = getBlockTypeFromSelection();
      setCurrentBlockType(blockType ?? "paragraph");
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateCurrentBlockType();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(() => {
        updateCurrentBlockType();
      })
    );
  }, [editor, updateCurrentBlockType]);

  const handleBlockTypeChange = useCallback(
    (blockType: BlockTypeValue) => {
      applyBlockType(editor, blockType);
      setCurrentBlockType(blockType);
      setIsOpen(false);
    },
    [editor]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        const initialIndex = Math.max(
          BLOCK_OPTIONS.findIndex(
            (option) => option.value === currentBlockType
          ),
          0
        );

        setActiveIndex(initialIndex);
      }

      setIsOpen(open);
    },
    [currentBlockType]
  );

  const focusOption = useCallback((index: number) => {
    const optionCount = BLOCK_OPTIONS.length;
    const nextIndex = (index + optionCount) % optionCount;

    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeIndex, isOpen]);

  const handleListKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          focusOption(activeIndex + 1);
          return;
        }
        case "ArrowUp": {
          event.preventDefault();
          focusOption(activeIndex - 1);
          return;
        }
        case "Home": {
          event.preventDefault();
          focusOption(0);
          return;
        }
        case "End": {
          event.preventDefault();
          focusOption(BLOCK_OPTIONS.length - 1);
          return;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          handleBlockTypeChange(BLOCK_OPTIONS[activeIndex].value);
          return;
        }
        default: {
          return;
        }
      }
    },
    [activeIndex, focusOption, handleBlockTypeChange]
  );

  const CurrentIcon = BLOCK_ICONS[currentOption?.value ?? "paragraph"];

  return (
    <div className="flex items-center gap-1">
      <Popover onOpenChange={handleOpenChange} open={isOpen}>
        <PopoverTrigger render={<Button size="sm" variant="outline" />}>
          <CurrentIcon className="size-4" />
          <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1">
          <div
            className="space-y-1"
            onKeyDown={handleListKeyDown}
            role="listbox"
          >
            {BLOCK_OPTIONS.map((option) => {
              const Icon = BLOCK_ICONS[option.value];
              const optionIndex = BLOCK_OPTIONS.findIndex(
                (blockOption) => blockOption.value === option.value
              );
              const isSelected = option.value === currentBlockType;
              const isActive = optionIndex === activeIndex;

              return (
                <button
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                    isActive && "bg-accent"
                  )}
                  key={option.value}
                  onClick={() => handleBlockTypeChange(option.value)}
                  onFocus={() => setActiveIndex(optionIndex)}
                  onMouseEnter={() => setActiveIndex(optionIndex)}
                  ref={(element) => {
                    optionRefs.current[optionIndex] = element;
                  }}
                  role="option"
                  tabIndex={optionIndex === activeIndex ? 0 : -1}
                  type="button"
                >
                  <span className="mt-0.5 rounded-sm bg-muted p-1 text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium text-foreground text-sm">
                      {option.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {option.description}
                    </span>
                  </span>
                  {isSelected && (
                    <CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Separator className="mx-1 h-5" orientation="vertical" />

      <Button
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <UndoIcon />
      </Button>
      <Button
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <RedoIcon />
      </Button>

      <Separator className="mx-1 h-5" orientation="vertical" />

      <Button
        aria-label="Align left"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <AlignLeftIcon />
      </Button>
      <Button
        aria-label="Align center"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <AlignCenterIcon />
      </Button>
      <Button
        aria-label="Align right"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <AlignRightIcon />
      </Button>

      <Separator className="mx-1 h-5" orientation="vertical" />

      <Button
        aria-label="Outdent"
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <IndentDecreaseIcon />
      </Button>
      <Button
        aria-label="Indent"
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <IndentIncreaseIcon />
      </Button>
    </div>
  );
}
