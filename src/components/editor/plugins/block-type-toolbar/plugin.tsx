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
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  RedoIcon,
  UndoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BlockTypeDrop } from "./block-type-drop";
import type { BlockTypeValue } from "./types";
import { getBlockTypeFromSelection } from "./utils";

export function BlockTypeToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [currentBlockType, setCurrentBlockType] =
    useState<BlockTypeValue>("paragraph");

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

  return (
    <div className="flex items-center gap-1">
      <BlockTypeDrop
        blockType={currentBlockType}
        editor={editor}
        onBlockTypeChange={setCurrentBlockType}
      />

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
