import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from "lexical";
import {
  BoldIcon,
  CheckIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import {
  clearToolbarLink,
  submitToolbarLink,
  toggleToolbarFormat,
} from "./actions";
import { DEFAULT_FORMAT_STATE, EMPTY_TOOLBAR_POSITION } from "./constants";
import { readFloatingToolbarState } from "./selection";
import type {
  FloatingToolbarFormatState,
  FloatingToolbarPosition,
} from "./types";

const TOOLBAR_FORMAT_ACTIONS = [
  { format: "bold", icon: BoldIcon, key: "isBold" },
  { format: "italic", icon: ItalicIcon, key: "isItalic" },
  { format: "underline", icon: UnderlineIcon, key: "isUnderline" },
  { format: "strikethrough", icon: StrikethroughIcon, key: "isStrikethrough" },
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
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const updateToolbar = useCallback(() => {
    const toolbarState = readFloatingToolbarState();

    setFormats(toolbarState.formats);
    setIsVisible(toolbarState.isVisible);
    setPosition(toolbarState.position);

    if (!linkMode) {
      setLinkUrl(toolbarState.linkUrl);
    }
  }, [linkMode]);

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
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor, updateToolbar]);

  const handleLinkSubmit = useCallback(() => {
    const nextLinkUrl = submitToolbarLink(editor, linkUrl);
    setLinkMode(false);
    setLinkUrl(nextLinkUrl);
  }, [editor, linkUrl]);

  const handleLinkCancel = useCallback(() => {
    setLinkMode(false);
    setLinkUrl("");
  }, []);

  const handleLinkToggle = useCallback(() => {
    if (formats.isLink) {
      clearToolbarLink(editor);
      return;
    }

    setLinkMode(true);
    setLinkUrl("");
  }, [editor, formats.isLink]);

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
          "flex items-center gap-0.5 rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10",
          "fade-in-0 zoom-in-95 animate-in duration-100"
        )}
        role="toolbar"
      >
        {linkMode ? (
          <div className="flex items-center gap-1 px-1">
            <Input
              className="h-7 w-48 text-xs"
              onChange={(event) => {
                setLinkUrl((event.target as HTMLInputElement).value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleLinkSubmit();
                }

                if (event.key === "Escape") {
                  handleLinkCancel();
                }
              }}
              placeholder="https://..."
              value={linkUrl}
            />
            <Button onClick={handleLinkSubmit} size="icon-xs" variant="ghost">
              <CheckIcon />
            </Button>
            <Button onClick={handleLinkCancel} size="icon-xs" variant="ghost">
              <XIcon />
            </Button>
          </div>
        ) : (
          <>
            {TOOLBAR_FORMAT_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <Toggle
                  key={action.format}
                  onPressedChange={() =>
                    toggleToolbarFormat(editor, action.format)
                  }
                  pressed={formats[action.key]}
                  size="sm"
                >
                  <Icon />
                </Toggle>
              );
            })}
            <Separator className="mx-0.5 h-5" orientation="vertical" />
            <Toggle
              onPressedChange={handleLinkToggle}
              pressed={formats.isLink}
              size="sm"
            >
              <LinkIcon />
            </Toggle>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
