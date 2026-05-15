"use client";

import type { LexicalEditor } from "lexical";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_OPTIONS } from "./options";
import type { BlockTypeValue } from "./types";
import { applyBlockType, getCurrentBlockOption } from "./utils";

interface BlockTypeDropProps {
  blockType: BlockTypeValue;
  className?: string;
  editor: LexicalEditor;
  onBlockTypeChange?: (value: BlockTypeValue) => void;
}

export function BlockTypeDrop({
  blockType,
  className,
  editor,
  onBlockTypeChange,
}: BlockTypeDropProps) {
  const currentOption = getCurrentBlockOption(blockType, BLOCK_OPTIONS);
  const CurrentIcon = BLOCK_ICONS[currentOption?.value ?? "paragraph"];

  const handleChange = (value: BlockTypeValue) => {
    applyBlockType(editor, value);
    onBlockTypeChange?.(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
        <CurrentIcon className="size-4" />
        <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className={cn("w-72", className)}>
        {BLOCK_OPTIONS.map((option) => {
          const Icon = BLOCK_ICONS[option.value];
          const isSelected = option.value === blockType;

          return (
            <DropdownMenuItem
              className={cn(
                "items-start gap-3 px-3 py-2",
                isSelected && "bg-accent/40"
              )}
              key={option.value}
              onClick={() => handleChange(option.value)}
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
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
