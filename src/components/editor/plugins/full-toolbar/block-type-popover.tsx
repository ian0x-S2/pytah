"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  BLOCK_OPTIONS,
} from "../block-type-toolbar/options";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { getCurrentBlockOption } from "../block-type-toolbar/utils";
import { BLOCK_ABBR } from "./constants";
import type { FullToolbarUiAction } from "./types";

interface BlockTypePopoverProps {
  activeBlockTypeIndex: number;
  blockType: BlockTypeValue;
  blockTypeOpen: boolean;
  dispatchUi: (action: FullToolbarUiAction) => void;
  onBlockTypeChange: (value: BlockTypeValue) => void;
  onOpenChange: (open: boolean) => void;
}

export function BlockTypePopover({
  activeBlockTypeIndex,
  blockType,
  blockTypeOpen,
  dispatchUi,
  onBlockTypeChange,
  onOpenChange,
}: BlockTypePopoverProps) {
  const blockTypeOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const currentOption = getCurrentBlockOption(blockType, BLOCK_OPTIONS);

  const focusBlockTypeOption = (index: number) => {
    const optionCount = BLOCK_OPTIONS.length;
    const nextIndex = (index + optionCount) % optionCount;

    dispatchUi({
      type: "set-active-block-type-index",
      payload: nextIndex,
    });
    blockTypeOptionRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    if (!blockTypeOpen) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      blockTypeOptionRefs.current[activeBlockTypeIndex]?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeBlockTypeIndex, blockTypeOpen]);

  const handleBlockTypeListKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        focusBlockTypeOption(activeBlockTypeIndex + 1);
        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        focusBlockTypeOption(activeBlockTypeIndex - 1);
        return;
      }
      case "Home": {
        event.preventDefault();
        focusBlockTypeOption(0);
        return;
      }
      case "End": {
        event.preventDefault();
        focusBlockTypeOption(BLOCK_OPTIONS.length - 1);
        return;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        onBlockTypeChange(BLOCK_OPTIONS[activeBlockTypeIndex].value);
        return;
      }
      default: {
        return;
      }
    }
  };

  const abbr = BLOCK_ABBR[blockType] ?? "P";
  const isParagraph = blockType === "paragraph";

  return (
    <Popover onOpenChange={onOpenChange} open={blockTypeOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label={`Block type: ${currentOption?.label ?? BLOCK_LABELS.paragraph}`}
            className={cn(
              "h-7 gap-1 rounded-full px-2 font-semibold text-xs",
              isParagraph
                ? "variant-ghost"
                : "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            size="sm"
            type="button"
            variant={isParagraph ? "ghost" : "ghost"}
          />
        }
      >
        <span className="min-w-[1.5ch] text-center">{abbr}</span>
        <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        <div
          className="space-y-0.5"
          onKeyDown={handleBlockTypeListKeyDown}
          role="listbox"
        >
          {BLOCK_OPTIONS.map((option, optionIndex) => {
            const Icon = BLOCK_ICONS[option.value];
            const isSelected = option.value === blockType;
            const isActive = optionIndex === activeBlockTypeIndex;

            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  isActive && "bg-accent"
                )}
                key={option.value}
                onClick={() => onBlockTypeChange(option.value)}
                onFocus={() =>
                  dispatchUi({
                    type: "set-active-block-type-index",
                    payload: optionIndex,
                  })
                }
                onMouseEnter={() =>
                  dispatchUi({
                    type: "set-active-block-type-index",
                    payload: optionIndex,
                  })
                }
                ref={(element) => {
                  blockTypeOptionRefs.current[optionIndex] = element;
                }}
                role="option"
                tabIndex={optionIndex === activeBlockTypeIndex ? 0 : -1}
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
  );
}
