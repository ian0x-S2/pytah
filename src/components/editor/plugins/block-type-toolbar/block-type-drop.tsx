"use client";

import type { LexicalEditor } from "lexical";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useInsertDialogs } from "../slash-command/use-insert-dialogs";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  BLOCK_OPTIONS,
  getAvailableBlockOptions,
  INSERT_SECTION_TYPES,
} from "./options";
import type { BlockOption, BlockTypeValue } from "./types";
import { applyBlockType, getCurrentBlockOption } from "./utils";

const isConversionOption = (option: BlockOption): boolean =>
  !INSERT_SECTION_TYPES.has(option.value);

interface BlockTypeDropProps {
  blockType: BlockTypeValue;
  className?: string;
  /**
   * Slash command ids resolved from the enabled feature set. Options whose
   * commands are feature-gated only render when their id is present. When
   * omitted, every block option renders.
   */
  commandIds?: readonly string[];
  editor: LexicalEditor;
  onBlockTypeChange?: (value: BlockTypeValue) => void;
}

export const BlockTypeDrop = memo(function BlockTypeDrop({
  blockType,
  className,
  commandIds,
  editor,
  onBlockTypeChange,
}: BlockTypeDropProps) {
  const availableOptions = getAvailableBlockOptions(
    commandIds ?? BLOCK_OPTIONS.map((option) => option.value)
  );
  const conversionOptions = availableOptions.filter(isConversionOption);
  const insertOptions = availableOptions.filter(
    (option) => !isConversionOption(option)
  );

  const currentOption = getCurrentBlockOption(blockType, availableOptions);
  const CurrentIcon = BLOCK_ICONS[currentOption?.value ?? "paragraph"];

  const { dialogs, openColumns, openImage, openYouTube } =
    useInsertDialogs("block-type");

  const handleChange = (value: BlockTypeValue) => {
    if (value === "image") {
      openImage();
      return;
    }

    if (value === "youtube") {
      openYouTube();
      return;
    }

    // Columns opens the layout preset picker, matching the slash menu flow.
    if (value === "columns") {
      openColumns();
      return;
    }

    applyBlockType(editor, value);
    onBlockTypeChange?.(value);
  };

  const renderOption = (option: BlockOption) => {
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
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          <CurrentIcon className="size-4" />
          <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className={cn("w-72", className)}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Turn into</DropdownMenuLabel>
            {conversionOptions.map(renderOption)}
          </DropdownMenuGroup>

          {insertOptions.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Insert</DropdownMenuLabel>
              {insertOptions.map(renderOption)}
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </>
  );
});
