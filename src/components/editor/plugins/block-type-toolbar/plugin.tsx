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
import { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToolbarTooltip } from "../../ui/toolbar-tooltip";
import { BlockTypeDrop } from "./block-type-drop";
import type { BlockTypeValue } from "./types";
import { getBlockTypeFromSelection } from "./utils";

interface BlockTypeToolbarPluginProps {
  /** Slash command ids resolved from the enabled feature set. */
  commandIds?: readonly string[];
}

export const BlockTypeToolbarPlugin = memo(function BlockTypeToolbarPlugin({
  commandIds,
}: BlockTypeToolbarPluginProps) {
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
      <TooltipProvider>
        <BlockTypeDrop
          blockType={currentBlockType}
          commandIds={commandIds}
          editor={editor}
          onBlockTypeChange={setCurrentBlockType}
        />

        <Separator className="mx-1 h-5" orientation="vertical" />

        <ToolbarTooltip label="Undo">
          <Button
            aria-label="Undo"
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <UndoIcon />
          </Button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Redo">
          <Button
            aria-label="Redo"
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RedoIcon />
          </Button>
        </ToolbarTooltip>

        <Separator className="mx-1 h-5" orientation="vertical" />

        <ToolbarTooltip label="Align left">
          <Button
            aria-label="Align left"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <AlignLeftIcon />
          </Button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Align center">
          <Button
            aria-label="Align center"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <AlignCenterIcon />
          </Button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Align right">
          <Button
            aria-label="Align right"
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <AlignRightIcon />
          </Button>
        </ToolbarTooltip>

        <Separator className="mx-1 h-5" orientation="vertical" />

        <ToolbarTooltip label="Outdent">
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
        </ToolbarTooltip>
        <ToolbarTooltip label="Indent">
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
        </ToolbarTooltip>
      </TooltipProvider>
    </div>
  );
});
