"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import type { ElementFormatType } from "lexical";
import {
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  RedoIcon,
  UndoIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { ToolbarTooltip } from "../../ui/toolbar-tooltip";
import { TOOLBAR_ALIGN_ACTIONS } from "../floating-toolbar/constants";
import { BlockTypeDrop } from "./block-type-drop";
import type { BlockTypeValue } from "./types";
import {
  getBlockTypeFromSelection,
  getElementFormatFromSelection,
} from "./utils";

interface BlockTypeToolbarPluginProps {
  className?: string;
  /** Slash command ids resolved from the enabled feature set. */
  commandIds?: readonly string[];
}

export function BlockTypeToolbarPlugin({
  className,
  commandIds,
}: BlockTypeToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [currentBlockType, setCurrentBlockType] =
    useState<BlockTypeValue>("paragraph");
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const updateCurrentBlockType = () => {
      editor.getEditorState().read(() => {
        const blockType = getBlockTypeFromSelection();
        const resolvedBlockType = blockType ?? "paragraph";
        const nextFormat = getElementFormatFromSelection();

        setCurrentBlockType((current) =>
          current === resolvedBlockType ? current : resolvedBlockType
        );
        setElementFormat((current) =>
          current === nextFormat ? current : nextFormat
        );
      });
    };

    updateCurrentBlockType();

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateCurrentBlockType();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(updateCurrentBlockType)
    );
  }, [editor]);

  return (
    <div
      aria-label="Formatting toolbar"
      className={cn("flex items-center gap-1", className)}
      role="toolbar"
    >
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
            disabled={!canUndo}
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <UndoIcon aria-hidden />
          </Button>
        </ToolbarTooltip>
        <ToolbarTooltip label="Redo">
          <Button
            aria-label="Redo"
            disabled={!canRedo}
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <RedoIcon aria-hidden />
          </Button>
        </ToolbarTooltip>

        <Separator className="mx-1 h-5" orientation="vertical" />

        {TOOLBAR_ALIGN_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isActive =
            elementFormat === action.align ||
            (action.align === "left" && elementFormat === "");

          return (
            <ToolbarTooltip key={action.align} label={action.label}>
              <Button
                aria-label={action.label}
                aria-pressed={isActive}
                onClick={() =>
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, action.align)
                }
                size="icon-sm"
                type="button"
                variant={isActive ? "secondary" : "ghost"}
              >
                <Icon aria-hidden />
              </Button>
            </ToolbarTooltip>
          );
        })}

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
            <IndentDecreaseIcon aria-hidden />
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
            <IndentIncreaseIcon aria-hidden />
          </Button>
        </ToolbarTooltip>
      </TooltipProvider>
    </div>
  );
}
