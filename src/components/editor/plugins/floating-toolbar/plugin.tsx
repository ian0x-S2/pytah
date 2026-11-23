"use client";

import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { BaselineIcon, LinkIcon, PaintBucketIcon } from "lucide-react";
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

import {
  useEditorFloatingLinkEnabled,
  useEditorResolvedCommands,
} from "../../core/editor-commands-context";
import { ColorSwatches } from "../../ui/color-swatches";
import { ToolbarTooltip } from "../../ui/toolbar-tooltip";
import { BlockTypeDrop } from "../block-type-toolbar/block-type-drop";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { getBlockTypeFromSelection } from "../block-type-toolbar/utils";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../link-behavior/commands";
import { LINK_PLACEHOLDER_URL } from "../link-behavior/utils";
import { applyBgColor, applyTextColor, toggleToolbarFormat } from "./actions";
import {
  DEFAULT_FORMAT_STATE,
  EMPTY_TOOLBAR_POSITION,
  TOOLBAR_FORMAT_ACTIONS,
} from "./constants";
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

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const commandIds = useEditorResolvedCommands();
  const isFloatingLinkEnabled = useEditorFloatingLinkEnabled();

  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
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
    isVisibleRef.current = isVisible;
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
  const viewportRafRef = useRef<number | null>(null);

  const updateToolbar = useEffectEvent(() => {
    editor.getEditorState().read(() => {
      const toolbarState = readFloatingToolbarState(editor);

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
          openSurfaceCountRef.current = 0;
          setIsVisible((currentIsVisible) =>
            currentIsVisible ? false : currentIsVisible
          );
          return;
        }
        linkEditorOpenRef.current = false;
      }

      if (openSurfaceCountRef.current === 0) {
        if (!toolbarState.isVisible) {
          openSurfaceCountRef.current = 0;
        }
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

  const handleBlur = useEffectEvent((event: FocusEvent) => {
    if (openSurfaceCountRef.current > 0) {
      return;
    }

    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      toolbarRef.current?.contains(nextTarget)
    ) {
      return;
    }

    openSurfaceCountRef.current = 0;
    setIsVisible(false);
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
        editor.registerCommand(
          BLUR_COMMAND,
          (event) => {
            handleBlur(event);
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

  useEffect(() => {
    const scheduleViewportSync = () => {
      if (!isVisibleRef.current || viewportRafRef.current !== null) {
        return;
      }

      viewportRafRef.current = window.requestAnimationFrame(() => {
        viewportRafRef.current = null;
        updateToolbar();
      });
    };

    window.addEventListener("resize", scheduleViewportSync, { passive: true });
    window.addEventListener("scroll", scheduleViewportSync, {
      capture: true,
      passive: true,
    });

    return () => {
      if (viewportRafRef.current !== null) {
        window.cancelAnimationFrame(viewportRafRef.current);
        viewportRafRef.current = null;
      }
      window.removeEventListener("resize", scheduleViewportSync);
      window.removeEventListener("scroll", scheduleViewportSync, true);
    };
  }, []);

  const handleLinkToggle = () => {
    if (formats.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }

    editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
    if (isFloatingLinkEnabled) {
      editor.dispatchCommand(OPEN_FLOATING_LINK_EDITOR_COMMAND, undefined);
      linkEditorOpenRef.current = true;
      openSurfaceCountRef.current = 0;
      setIsVisible(false);
    }
  };

  const handleSurfaceOpenChange = (open: boolean) => {
    openSurfaceCountRef.current = Math.max(
      0,
      openSurfaceCountRef.current + (open ? 1 : -1)
    );
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
                  onMouseDown={(event) => event.preventDefault()}
                  onPressedChange={() =>
                    toggleToolbarFormat(editor, action.format)
                  }
                  pressed={formats[action.key]}
                  size="sm"
                >
                  <Icon aria-hidden />
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

          {isFloatingLinkEnabled ? (
            <ToolbarTooltip label="Link">
              <Toggle
                aria-label="Link"
                onMouseDown={(event) => event.preventDefault()}
                onPressedChange={handleLinkToggle}
                pressed={formats.isLink}
                size="sm"
              >
                <LinkIcon aria-hidden />
              </Toggle>
            </ToolbarTooltip>
          ) : null}

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
