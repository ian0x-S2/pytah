"use client";

import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  BaselineIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  LinkIcon,
  PaintBucketIcon,
  RedoIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UndoIcon,
} from "lucide-react";
import { useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ColorSwatches } from "../../ui/color-swatches";
import { BLOCK_OPTIONS } from "../block-type-toolbar/options";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { applyBlockType } from "../block-type-toolbar/utils";
import {
  applyBgColor,
  applyTextColor,
  toggleToolbarFormat,
} from "../floating-toolbar/actions";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../floating-toolbar/link-command";
import { LINK_PLACEHOLDER_URL } from "../link-behavior/utils";
import { BlockTypePopover } from "./block-type-popover";
import { ALIGN_ACTIONS, INLINE_FORMAT_ACTIONS } from "./constants";
import { InsertPopover } from "./insert-popover";
import { fullToolbarUiReducer } from "./reducer";
import { INITIAL_UI_STATE } from "./types";
import { useToolbarState } from "./use-toolbar-state";

interface FullToolbarPluginProps {
  className?: string;
}

export function FullToolbarPlugin({ className }: FullToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const { blockType, formats, setBlockType } = useToolbarState();
  const [uiState, dispatchUi] = useReducer(
    fullToolbarUiReducer,
    INITIAL_UI_STATE
  );
  const { activeBlockTypeIndex, activeInsertIndex, blockTypeOpen, insertOpen } =
    uiState;

  const handleBlockTypeChange = (value: BlockTypeValue) => {
    applyBlockType(editor, value);
    setBlockType(value);
    dispatchUi({ type: "set-block-type-open", payload: { open: false } });
  };

  const handleBlockTypeOpenChange = (open: boolean) => {
    if (open) {
      const initialIndex = Math.max(
        BLOCK_OPTIONS.findIndex((option) => option.value === blockType),
        0
      );

      dispatchUi({
        type: "set-block-type-open",
        payload: { activeBlockTypeIndex: initialIndex, open },
      });
      return;
    }

    dispatchUi({ type: "set-block-type-open", payload: { open } });
  };

  const handleLinkToggle = () => {
    if (formats.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
    editor.dispatchCommand(OPEN_FLOATING_LINK_EDITOR_COMMAND, undefined);
  };

  return (
    <div
      aria-label="Formatting toolbar"
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      role="toolbar"
    >
      <Button
        aria-label="Undo"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <UndoIcon />
      </Button>
      <Button
        aria-label="Redo"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <RedoIcon />
      </Button>

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      <BlockTypePopover
        activeBlockTypeIndex={activeBlockTypeIndex}
        blockType={blockType}
        blockTypeOpen={blockTypeOpen}
        dispatchUi={dispatchUi}
        onBlockTypeChange={handleBlockTypeChange}
        onOpenChange={handleBlockTypeOpenChange}
      />

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      {INLINE_FORMAT_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Toggle
            aria-label={action.label}
            key={action.format}
            onPressedChange={() => toggleToolbarFormat(editor, action.format)}
            pressed={formats[action.key]}
            size="sm"
          >
            <Icon />
          </Toggle>
        );
      })}

      <ColorSwatches
        activeColor={formats.textColor}
        icon={BaselineIcon}
        label="Text color"
        onColorChange={(color) => applyTextColor(editor, color)}
      />
      <ColorSwatches
        activeColor={formats.bgColor}
        icon={PaintBucketIcon}
        label="Background color"
        onColorChange={(color) => applyBgColor(editor, color)}
      />

      <Toggle
        aria-label="Link"
        onPressedChange={handleLinkToggle}
        pressed={formats.isLink}
        size="sm"
      >
        <LinkIcon />
      </Toggle>

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      <Toggle
        aria-label="Superscript"
        onPressedChange={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
        }
        pressed={formats.isSuperscript}
        size="sm"
      >
        <SuperscriptIcon />
      </Toggle>
      <Toggle
        aria-label="Subscript"
        onPressedChange={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
        }
        pressed={formats.isSubscript}
        size="sm"
      >
        <SubscriptIcon />
      </Toggle>

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      {ALIGN_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            aria-label={action.label}
            key={action.align}
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, action.align)
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Icon />
          </Button>
        );
      })}

      <Separator className="mx-0.5 h-4" orientation="vertical" />

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

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      <InsertPopover
        activeInsertIndex={activeInsertIndex}
        dispatchUi={dispatchUi}
        insertOpen={insertOpen}
        onOpenChange={(open) =>
          dispatchUi({
            type: "set-insert-open",
            payload: { activeInsertIndex: 0, open },
          })
        }
      />
    </div>
  );
}
