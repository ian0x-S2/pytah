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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const currentOption = getCurrentBlockOption(currentBlockType, BLOCK_OPTIONS);
  const CurrentIcon = BLOCK_ICONS[currentOption?.value ?? "paragraph"];

  useEffect(() => {
    function updateCurrentBlockType() {
      editor.getEditorState().read(() => {
        const blockType = getBlockTypeFromSelection();
        const resolvedBlockType = blockType ?? "paragraph";

        setCurrentBlockType((current) =>
          current === resolvedBlockType ? current : resolvedBlockType
        );
      });
    }

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateCurrentBlockType();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(updateCurrentBlockType)
    );
  }, [editor]);

  function handleBlockTypeChange(blockType: BlockTypeValue) {
    applyBlockType(editor, blockType);
    setCurrentBlockType(blockType);
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          <CurrentIcon className="size-4" />
          <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72">
          {BLOCK_OPTIONS.map((option) => {
            const Icon = BLOCK_ICONS[option.value];
            const isSelected = option.value === currentBlockType;

            return (
              <DropdownMenuItem
                className={cn(
                  "items-start gap-3 px-3 py-2",
                  isSelected && "bg-accent/40"
                )}
                key={option.value}
                onClick={() => handleBlockTypeChange(option.value)}
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
