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
import { ChevronDownIcon, RedoIcon, UndoIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
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

  const currentOption = useMemo(() => {
    return getCurrentBlockOption(currentBlockType, BLOCK_OPTIONS);
  }, [currentBlockType]);

  const updateCurrentBlockType = useCallback(() => {
    editor.getEditorState().read(() => {
      const blockType = getBlockTypeFromSelection();
      if (blockType) {
        setCurrentBlockType(blockType);
      }
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

  const CurrentIcon = BLOCK_ICONS[currentOption?.value ?? "paragraph"];

  return (
    <div className="flex items-center gap-1">
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger render={<Button size="sm" variant="outline" />}>
          <CurrentIcon className="size-4" />
          <span>{currentOption?.label ?? BLOCK_LABELS.paragraph}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1">
          <div className="space-y-1">
            {BLOCK_OPTIONS.map((option) => {
              const Icon = BLOCK_ICONS[option.value];

              return (
                <button
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  key={option.value}
                  onClick={() => handleBlockTypeChange(option.value)}
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
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        size="sm"
        type="button"
        variant="ghost"
      >
        Left
      </Button>
      <Button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        size="sm"
        type="button"
        variant="ghost"
      >
        Center
      </Button>
      <Button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        size="sm"
        type="button"
        variant="ghost"
      >
        Right
      </Button>

      <Separator className="mx-1 h-5" orientation="vertical" />

      <Button
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
        size="sm"
        type="button"
        variant="ghost"
      >
        Outdent
      </Button>
      <Button
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
        size="sm"
        type="button"
        variant="ghost"
      >
        Indent
      </Button>
    </div>
  );
}
