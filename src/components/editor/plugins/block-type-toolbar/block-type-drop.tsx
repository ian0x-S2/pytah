"use client";

import type { LexicalEditor } from "lexical";
import { CheckIcon, ChevronDownIcon, TypeIcon } from "lucide-react";

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

import {
  useEditorCommands,
  useEditorResolvedCommands,
} from "../../core/editor-commands-context";
import { getCoreSlashRunner } from "../slash-command/executors";
import { runToolbarInsert } from "../slash-command/utils";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
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
   * Optional explicit command id allowlist. Defaults to the per-editor
   * `EditorResolvedCommandsContext`.
   */
  commandIds?: readonly string[];
  editor: LexicalEditor;
  onBlockTypeChange?: (value: BlockTypeValue) => void;
  /** Notified when the dropdown opens/closes — used by the floating toolbar
   *  to avoid being hidden while the menu is in use. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Whether to render the "Insert" section in `full` variant. Set `false`
   * when a sibling `InsertPopover` already exposes insert actions.
   * @default true
   */
  showInsert?: boolean;
  variant?: "full" | "compact";
}

export function BlockTypeDrop({
  blockType,
  className,
  commandIds,
  editor,
  onBlockTypeChange,
  onOpenChange,
  showInsert = true,
  variant = "full",
}: BlockTypeDropProps) {
  const contextCommandIds = useEditorResolvedCommands();
  const editorCommands = useEditorCommands();

  const resolvedCommandIds = commandIds ?? contextCommandIds;
  const availableOptions = getAvailableBlockOptions(
    resolvedCommandIds,
    editorCommands
  );
  const conversionOptions = availableOptions.filter(isConversionOption);
  const insertOptions = availableOptions.filter(
    (option) => !isConversionOption(option)
  );

  const currentOption = getCurrentBlockOption(blockType, availableOptions);
  const CurrentIcon =
    currentOption?.icon ??
    BLOCK_ICONS[currentOption?.value ?? "paragraph"] ??
    TypeIcon;

  const findCommandRunner = (id: string) =>
    editorCommands.find((entry) => entry.command.id === id)?.run ??
    getCoreSlashRunner(id);

  const handleChange = (value: BlockTypeValue) => {
    const runner = findCommandRunner(value);

    if (INSERT_SECTION_TYPES.has(value)) {
      if (runner) {
        runToolbarInsert(editor, runner);
      }
      return;
    }

    applyBlockType(editor, value, runner);
    onBlockTypeChange?.(value);
  };

  const renderOption = (option: BlockOption) => {
    const Icon = option.icon ?? BLOCK_ICONS[option.value] ?? TypeIcon;
    const isSelected = option.value === blockType;

    return (
      <DropdownMenuItem
        className="items-start gap-2 overflow-hidden px-2.5 py-1.5"
        key={option.value}
        onClick={() => handleChange(option.value)}
      >
        <span className="mt-0.5 shrink-0 rounded-sm bg-muted p-0.5 text-muted-foreground">
          <Icon aria-hidden className="size-3" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {option.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        </span>
        {isSelected ? (
          <CheckIcon
            aria-hidden
            className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground"
          />
        ) : null}
      </DropdownMenuItem>
    );
  };

  const renderCompactOption = (option: BlockOption) => {
    const Icon = option.icon ?? BLOCK_ICONS[option.value] ?? TypeIcon;
    const isSelected = option.value === blockType;

    return (
      <DropdownMenuItem
        className="gap-2.5 px-2.5 py-1.5"
        key={option.value}
        onClick={() => handleChange(option.value)}
      >
        <Icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm text-foreground">{option.label}</span>
        {isSelected ? (
          <CheckIcon
            aria-hidden
            className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground"
          />
        ) : null}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      {variant === "compact" ? (
        <DropdownMenuTrigger
          className="min-w-32 justify-start"
          render={<Button size="sm" variant="outline" />}
        >
          <CurrentIcon aria-hidden className="size-3.5" />
          <span className="truncate">
            {currentOption?.label ?? BLOCK_LABELS.paragraph}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="ml-auto size-3.5 text-muted-foreground"
          />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          <CurrentIcon aria-hidden className="size-4" />
          <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
          <ChevronDownIcon
            aria-hidden
            className="size-4 text-muted-foreground"
          />
        </DropdownMenuTrigger>
      )}

      {variant === "compact" ? (
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
          viewportClassName="max-h-[19.375rem]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Turn into</DropdownMenuLabel>
            {conversionOptions.map(renderOption)}
          </DropdownMenuGroup>

          {showInsert && insertOptions.length > 0 ? (
            <DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Insert</DropdownMenuLabel>
              {insertOptions.map(renderOption)}
            </DropdownMenuGroup>
          ) : null}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
