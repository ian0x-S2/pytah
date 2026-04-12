"use client";

import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from "lexical";
import {
  BaselineIcon,
  BoldIcon,
  CodeIcon,
  HighlighterIcon,
  ItalicIcon,
  LinkIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ColorSwatches } from "../../ui/color-swatches";
import { LINK_PLACEHOLDER_URL } from "../link-behavior/utils";
import { applyBgColor, applyTextColor, toggleToolbarFormat } from "./actions";
import { DEFAULT_FORMAT_STATE, EMPTY_TOOLBAR_POSITION } from "./constants";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "./link-command";
import {
  areFloatingToolbarFormatsEqual,
  areFloatingToolbarPositionsEqual,
  readFloatingToolbarState,
} from "./selection";
import type {
  FloatingToolbarFormatState,
  FloatingToolbarPosition,
} from "./types";

const TOOLBAR_FORMAT_ACTIONS = [
  { format: "bold", icon: BoldIcon, key: "isBold" },
  { format: "italic", icon: ItalicIcon, key: "isItalic" },
  { format: "underline", icon: UnderlineIcon, key: "isUnderline" },
  { format: "strikethrough", icon: StrikethroughIcon, key: "isStrikethrough" },
  { format: "highlight", icon: HighlighterIcon, key: "isHighlight" },
  { format: "code", icon: CodeIcon, key: "isCode" },
] as const;

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<FloatingToolbarPosition>(
    EMPTY_TOOLBAR_POSITION
  );
  const [formats, setFormats] =
    useState<FloatingToolbarFormatState>(DEFAULT_FORMAT_STATE);

  /*
   * When a color picker popover is open we skip visibility/position updates so
   * the floating toolbar stays alive while the user browses swatches.  A ref
   * (rather than state) is used to avoid re-registering the update listener on
   * every open/close cycle.
   */
  const isColorPickerOpenRef = useRef(false);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const toolbarState = readFloatingToolbarState();

      setFormats((currentFormats) => {
        return areFloatingToolbarFormatsEqual(
          currentFormats,
          toolbarState.formats
        )
          ? currentFormats
          : toolbarState.formats;
      });

      if (!isColorPickerOpenRef.current) {
        setIsVisible((currentIsVisible) => {
          return currentIsVisible === toolbarState.isVisible
            ? currentIsVisible
            : toolbarState.isVisible;
        });
        setPosition((currentPosition) => {
          return areFloatingToolbarPositionsEqual(
            currentPosition,
            toolbarState.position
          )
            ? currentPosition
            : toolbarState.position;
        });
      }
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(() => {
        updateToolbar();
      })
    );
  }, [editor, updateToolbar]);

  const handleLinkToggle = useCallback(() => {
    if (formats.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }

    editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
    editor.dispatchCommand(OPEN_FLOATING_LINK_EDITOR_COMMAND, undefined);
  }, [editor, formats.isLink]);

  const handleColorPickerOpenChange = useCallback((open: boolean) => {
    isColorPickerOpenRef.current = open;
  }, []);

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50"
      ref={toolbarRef}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div
        aria-label="Formatting options"
        className={cn(
          "flex items-center gap-0.5 rounded-xl bg-popover p-1.5 shadow-lg ring-1 ring-border",
          "fade-in-0 zoom-in-95 animate-in duration-100"
        )}
        role="toolbar"
      >
        {TOOLBAR_FORMAT_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Toggle
              key={action.format}
              onPressedChange={() => toggleToolbarFormat(editor, action.format)}
              pressed={formats[action.key]}
              size="sm"
            >
              <Icon />
            </Toggle>
          );
        })}

        <Separator className="mx-0.5 h-5" orientation="vertical" />

        {/* Text color — uses `color` CSS property */}
        <ColorSwatches
          activeColor={formats.textColor}
          icon={BaselineIcon}
          label="Text color"
          onColorChange={(color) => applyTextColor(editor, color)}
          onOpenChange={handleColorPickerOpenChange}
        />

        {/* Background color — uses `background-color` CSS property */}
        <ColorSwatches
          activeColor={formats.bgColor}
          icon={PaintBucketIcon}
          label="Background color"
          onColorChange={(color) => applyBgColor(editor, color)}
          onOpenChange={handleColorPickerOpenChange}
        />

        <Separator className="mx-0.5 h-5" orientation="vertical" />

        <Toggle
          onPressedChange={handleLinkToggle}
          pressed={formats.isLink}
          size="sm"
        >
          <LinkIcon />
        </Toggle>
      </div>
    </div>,
    document.body
  );
}
