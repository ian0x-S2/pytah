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

import { getSlashRunner } from "../slash-command/executors";
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
  /** Notified when the dropdown opens/closes — used by the floating toolbar
   *  to avoid being hidden while the menu is in use. */
  onOpenChange?: (open: boolean) => void;
  /**
   * `full` (default) renders the static toolbar layout: icon chip, label and
   * description per item, plus the "Insert" section. `compact` renders the
   * floating-toolbar layout: conversion options only, single-line items and
   * a menu as wide as its trigger (with a floor width so short labels like
   * "Text" still yield a comfortable menu).
   */
  variant?: "full" | "compact";
}

export const BlockTypeDrop = memo(
  ({
    blockType,
    className,
    commandIds,
    editor,
    onBlockTypeChange,
    onOpenChange,
    variant = "full",
  }: BlockTypeDropProps) => {
    const availableOptions = getAvailableBlockOptions(
      commandIds ?? BLOCK_OPTIONS.map((option) => option.value)
    );
    const conversionOptions = availableOptions.filter(isConversionOption);
    const insertOptions = availableOptions.filter(
      (option) => !isConversionOption(option)
    );

    const currentOption = getCurrentBlockOption(blockType, availableOptions);
    const CurrentIcon = BLOCK_ICONS[currentOption?.value ?? "paragraph"];

    const handleChange = (value: BlockTypeValue) => {
      if (INSERT_SECTION_TYPES.has(value)) {
        getSlashRunner(value)?.(editor);
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
          className="items-start gap-2 overflow-hidden px-2.5 py-1.5"
          key={option.value}
          onClick={() => handleChange(option.value)}
        >
          <span className="mt-0.5 shrink-0 rounded-sm bg-muted p-0.5 text-muted-foreground">
            <Icon className="size-3" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          </span>
          {isSelected && (
            <CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />
          )}
        </DropdownMenuItem>
      );
    };

    const renderCompactOption = (option: BlockOption) => {
      const Icon = BLOCK_ICONS[option.value];
      const isSelected = option.value === blockType;

      return (
        <DropdownMenuItem
          className="gap-2.5 px-2.5 py-1.5"
          key={option.value}
          onClick={() => handleChange(option.value)}
        >
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">
            {option.label}
          </span>
          {isSelected && (
            <CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />
          )}
        </DropdownMenuItem>
      );
    };

    return (
      <DropdownMenu onOpenChange={onOpenChange}>
        {/*
         * The compact (floating) trigger keeps a floor width so the menu —
         * which follows the trigger's width — is comfortable even for short
         * labels like "Text". Classes stay static to satisfy the shadcn
         * lint rules; per-placement tuning goes through `variant`.
         */}
        {variant === "compact" ? (
          <DropdownMenuTrigger
            className="min-w-32 justify-start"
            render={<Button size="sm" variant="outline" />}
          >
            <CurrentIcon className="size-3.5" />
            <span className="truncate">
              {currentOption?.label ?? BLOCK_LABELS.paragraph}
            </span>
            <ChevronDownIcon className="ml-auto size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
        ) : (
          <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
            <CurrentIcon className="size-4" />
            <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
        )}

        {variant === "compact" ? (
          /*
           * Floating-toolbar layout: conversion options only, one line per
           * item (no descriptions), and the menu matches the trigger's own
           * width through the Base UI `--anchor-width` variable (min-w and
           * the fixed w-56 of the full variant are reset).
           */
          <DropdownMenuContent
            className={cn("max-h-80 min-w-0", className)}
            viewportClassName="max-h-80"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Turn into</DropdownMenuLabel>
              {conversionOptions.map(renderCompactOption)}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent
            className={cn("max-h-80 w-56 pb-1.5", className)}
            /* The popup's `max-h-80` already includes its own p-1 + pb-1.5,
               so the inner viewport must cap 10px lower or the popup's
               overflow-hidden clips the last item. */
            viewportClassName="max-h-[19.375rem]"
          >
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
        )}
      </DropdownMenu>
    );
  }
);

BlockTypeDrop.displayName = "BlockTypeDrop";
