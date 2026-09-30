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
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useEditorResolvedCommands } from "../../core/editor-commands-context";
import { ColorSwatches } from "../../ui/color-swatches";
import { ToolbarTooltip } from "../../ui/toolbar-tooltip";
import { BlockTypeDrop } from "../block-type-toolbar/block-type-drop";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { getBlockTypeFromSelection } from "../block-type-toolbar/utils";
import { LINK_PLACEHOLDER_URL } from "../link-behavior/utils";
import { applyBgColor, applyTextColor, toggleToolbarFormat } from "./actions";
import { DEFAULT_FORMAT_STATE, EMPTY_TOOLBAR_POSITION } from "./constants";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "./link-command";
import { FloatingToolbarOverflowMenu } from "./overflow-menu";
import { clampFloatingToolbarPosition } from "./position";
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
  { format: "bold", icon: BoldIcon, key: "isBold", label: "Bold" },
  { format: "italic", icon: ItalicIcon, key: "isItalic", label: "Italic" },
  {
    format: "underline",
    icon: UnderlineIcon,
    key: "isUnderline",
    label: "Underline",
  },
  {
    format: "strikethrough",
    icon: StrikethroughIcon,
    key: "isStrikethrough",
    label: "Strikethrough",
  },
  {
    format: "highlight",
    icon: HighlighterIcon,
    key: "isHighlight",
    label: "Highlight",
  },
  { format: "code", icon: CodeIcon, key: "isCode", label: "Inline code" },
] as const;

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const commandIds = useEditorResolvedCommands();

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<FloatingToolbarPosition>(
    EMPTY_TOOLBAR_POSITION
  );
  const [formats, setFormats] =
    useState<FloatingToolbarFormatState>(DEFAULT_FORMAT_STATE);
  const [blockType, setBlockType] = useState<BlockTypeValue>("paragraph");

  // The raw position anchors the toolbar at the selection midpoint; the
  // rendered box is clamped against the measured toolbar size so it never
  // overflows the browser viewport. Runs pre-paint (no flicker) whenever
  // the anchor moves.
  const [adjustedPosition, setAdjustedPosition] =
    useState<FloatingToolbarPosition>(EMPTY_TOOLBAR_POSITION);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }
    const toolbar = toolbarRef.current;
    if (!toolbar) {
      return;
    }

    const next = clampFloatingToolbarPosition({
      position,
      toolbar: { height: toolbar.offsetHeight, width: toolbar.offsetWidth },
      viewport: { height: window.innerHeight, width: window.innerWidth },
    });

    setAdjustedPosition((current) =>
      areFloatingToolbarPositionsEqual(current, next) ? current : next
    );
  }, [isVisible, position]);
  /*
   * When a color picker popover or the "Turn into" dropdown is open we skip
   * visibility/position updates so the floating toolbar stays alive while the
   * user interacts with floating surfaces. A ref (rather than state) is used
   * to avoid re-registering the update listener on every open/close cycle.
   */
  const openSurfaceCountRef = useRef(0);

  // Set when the user opens the link card from this toolbar. While it is
  // set and the selection still lives inside a single link, the toolbar
  // stays closed: the card is the active editing surface. The flag clears
  // once the selection leaves the link.
  const linkEditorOpenRef = useRef(false);

  const updateToolbar = useEffectEvent(() => {
    editor.getEditorState().read(() => {
      const toolbarState = readFloatingToolbarState();

      setFormats((currentFormats) =>
        areFloatingToolbarFormatsEqual(currentFormats, toolbarState.formats)
          ? currentFormats
          : toolbarState.formats
      );

      // Read inside the Lexical read() scope; the updater only compares.
      const nextBlockType = getBlockTypeFromSelection();
      if (nextBlockType) {
        setBlockType((currentBlockType) =>
          currentBlockType === nextBlockType ? currentBlockType : nextBlockType
        );
      }

      if (linkEditorOpenRef.current) {
        if (toolbarState.linkUrl !== "") {
          setIsVisible((currentIsVisible) =>
            currentIsVisible ? false : currentIsVisible
          );
          return;
        }
        linkEditorOpenRef.current = false;
      }

      if (openSurfaceCountRef.current === 0) {
        setIsVisible((currentIsVisible) =>
          currentIsVisible === toolbarState.isVisible
            ? currentIsVisible
            : toolbarState.isVisible
        );
        setPosition((currentPosition) =>
          areFloatingToolbarPositionsEqual(
            currentPosition,
            toolbarState.position
          )
            ? currentPosition
            : toolbarState.position
        );
      }
    });
  });

  useEffect(
    () =>
      mergeRegister(
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
      ),
    [editor]
  );

  const handleLinkToggle = () => {
    if (formats.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }

    editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
    editor.dispatchCommand(OPEN_FLOATING_LINK_EDITOR_COMMAND, undefined);
    linkEditorOpenRef.current = true;
    setIsVisible(false);
  };

  const handleSurfaceOpenChange = (open: boolean) => {
    openSurfaceCountRef.current += open ? 1 : -1;
  };

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50 -translate-x-1/2 -translate-y-full"
      ref={toolbarRef}
      style={{
        left: `${adjustedPosition.left}px`,
        top: `${adjustedPosition.top}px`,
      }}
    >
      <div
        aria-label="Formatting options"
        className={cn(
          "editor-floating editor-floating-padding-sm flex items-center gap-0.5",
          "animate-in duration-100 fade-in-0 zoom-in-95"
        )}
        role="toolbar"
      >
        <TooltipProvider>
          <BlockTypeDrop
            blockType={blockType}
            commandIds={commandIds}
            editor={editor}
            onOpenChange={handleSurfaceOpenChange}
            variant="compact"
          />

          <Separator className="mr-0.5 ml-1.5 h-5" orientation="vertical" />

          {TOOLBAR_FORMAT_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <ToolbarTooltip key={action.format} label={action.label}>
                <Toggle
                  aria-label={action.label}
                  onPressedChange={() =>
                    toggleToolbarFormat(editor, action.format)
                  }
                  pressed={formats[action.key]}
                  size="sm"
                >
                  <Icon />
                </Toggle>
              </ToolbarTooltip>
            );
          })}

          <Separator className="mx-0.5 h-5" orientation="vertical" />

          {/* Text color — uses `color` CSS property */}
          <ColorSwatches
            activeColor={formats.textColor}
            icon={BaselineIcon}
            label="Text color"
            onColorChange={(color) => applyTextColor(editor, color)}
            onOpenChange={handleSurfaceOpenChange}
          />

          {/* Background color — uses `background-color` CSS property */}
          <ColorSwatches
            activeColor={formats.bgColor}
            icon={PaintBucketIcon}
            label="Background color"
            onColorChange={(color) => applyBgColor(editor, color)}
            onOpenChange={handleSurfaceOpenChange}
          />

          <Separator className="mx-0.5 h-5" orientation="vertical" />

          <ToolbarTooltip label="Link">
            <Toggle
              aria-label="Link"
              onMouseDown={(event) => event.preventDefault()}
              onPressedChange={handleLinkToggle}
              pressed={formats.isLink}
              size="sm"
            >
              <LinkIcon />
            </Toggle>
          </ToolbarTooltip>

          <FloatingToolbarOverflowMenu
            editor={editor}
            formats={formats}
            onOpenChange={handleSurfaceOpenChange}
          />
        </TooltipProvider>
      </div>
    </div>,
    document.body
  );
}
