import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BaselineIcon,
  BoldIcon,
  CheckIcon,
  ChevronDownIcon,
  CodeIcon,
  HighlighterIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  LinkIcon,
  PaintBucketIcon,
  PlusIcon,
  RedoIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ColorSwatches } from "../../ui/color-swatches";
import {
  BLOCK_ICONS,
  BLOCK_LABELS,
  BLOCK_OPTIONS,
} from "../block-type-toolbar/options";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import {
  applyBlockType,
  getBlockTypeFromSelection,
  getCurrentBlockOption,
} from "../block-type-toolbar/utils";
import { INSERT_COLLAPSIBLE_COMMAND } from "../collapsible/commands";
import {
  applyBgColor,
  applyTextColor,
  toggleToolbarFormat,
} from "../floating-toolbar/actions";
import { DEFAULT_FORMAT_STATE } from "../floating-toolbar/constants";
import { OPEN_FLOATING_LINK_EDITOR_COMMAND } from "../floating-toolbar/link-command";
import { readInlineFormats } from "../floating-toolbar/selection";
import type { FloatingToolbarFormatState } from "../floating-toolbar/types";
import { LINK_PLACEHOLDER_URL } from "../link-behavior/utils";
import { DEFAULT_INSERT_TABLE_PAYLOAD } from "../table-behavior/constants";

/** Short abbreviations shown in the block-type pill. */
const BLOCK_ABBR: Record<BlockTypeValue, string> = {
  bullet: "•",
  check: "□",
  code: "<>",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  number: "1.",
  paragraph: "P",
  quote: "❝",
  table: "⊞",
};

const INLINE_FORMAT_ACTIONS = [
  { format: "bold", icon: BoldIcon, key: "isBold", label: "Bold" },
  { format: "italic", icon: ItalicIcon, key: "isItalic", label: "Italic" },
  {
    format: "strikethrough",
    icon: StrikethroughIcon,
    key: "isStrikethrough",
    label: "Strikethrough",
  },
  { format: "code", icon: CodeIcon, key: "isCode", label: "Inline code" },
  {
    format: "underline",
    icon: UnderlineIcon,
    key: "isUnderline",
    label: "Underline",
  },
  {
    format: "highlight",
    icon: HighlighterIcon,
    key: "isHighlight",
    label: "Highlight",
  },
] as const;

const ALIGN_ACTIONS = [
  { align: "left" as const, icon: AlignLeftIcon, label: "Align left" },
  { align: "center" as const, icon: AlignCenterIcon, label: "Align center" },
  { align: "right" as const, icon: AlignRightIcon, label: "Align right" },
  { align: "justify" as const, icon: AlignJustifyIcon, label: "Justify" },
];

interface FullToolbarPluginProps {
  className?: string;
}

export function FullToolbarPlugin({ className }: FullToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();

  const [blockType, setBlockType] = useState<BlockTypeValue>("paragraph");
  const [blockTypeOpen, setBlockTypeOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [formats, setFormats] =
    useState<FloatingToolbarFormatState>(DEFAULT_FORMAT_STATE);

  const currentOption = useMemo(
    () => getCurrentBlockOption(blockType, BLOCK_OPTIONS),
    [blockType]
  );

  const update = useCallback(() => {
    editor.getEditorState().read(() => {
      const nextBlockType = getBlockTypeFromSelection();
      if (nextBlockType) {
        setBlockType(nextBlockType);
      }
      setFormats(readInlineFormats());
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(() => {
        update();
      })
    );
  }, [editor, update]);

  const handleBlockTypeChange = useCallback(
    (value: BlockTypeValue) => {
      applyBlockType(editor, value);
      setBlockType(value);
      setBlockTypeOpen(false);
    },
    [editor]
  );

  const handleLinkToggle = useCallback(() => {
    if (formats.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, LINK_PLACEHOLDER_URL);
    editor.dispatchCommand(OPEN_FLOATING_LINK_EDITOR_COMMAND, undefined);
  }, [editor, formats.isLink]);

  const abbr = BLOCK_ABBR[blockType] ?? "P";
  const isParagraph = blockType === "paragraph";

  return (
    <div
      aria-label="Formatting toolbar"
      className={cn("flex flex-wrap items-center gap-0.5", className)}
      role="toolbar"
    >
      {/* Undo / Redo */}
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

      {/* Block type pill */}
      <Popover onOpenChange={setBlockTypeOpen} open={blockTypeOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label={`Block type: ${currentOption?.label ?? BLOCK_LABELS.paragraph}`}
              className={cn(
                "h-7 gap-1 rounded-full px-2 font-semibold text-xs",
                isParagraph
                  ? "variant-ghost"
                  : "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              size="sm"
              type="button"
              variant={isParagraph ? "ghost" : "ghost"}
            />
          }
        >
          <span className="min-w-[1.5ch] text-center">{abbr}</span>
          <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1">
          <div className="space-y-0.5">
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
                  {option.value === blockType && (
                    <CheckIcon className="ml-auto size-3.5 shrink-0 self-center text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      {/* Inline format toggles */}
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

      {/* Text color / background color */}
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

      {/* Link */}
      <Toggle
        aria-label="Link"
        onPressedChange={handleLinkToggle}
        pressed={formats.isLink}
        size="sm"
      >
        <LinkIcon />
      </Toggle>

      <Separator className="mx-0.5 h-4" orientation="vertical" />

      {/* Superscript / Subscript */}
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

      {/* Alignment */}
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

      {/* Indent / Outdent */}
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

      {/* Insert popover */}
      <Popover onOpenChange={setInsertOpen} open={insertOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label="Insert"
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs"
              size="sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <PlusIcon className="size-3.5" />
          <span>Insert</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => {
              editor.dispatchCommand(
                INSERT_TABLE_COMMAND,
                DEFAULT_INSERT_TABLE_PAYLOAD
              );
              setInsertOpen(false);
            }}
            type="button"
          >
            <TableIcon className="size-4 text-muted-foreground" />
            Table
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => {
              editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
              setInsertOpen(false);
            }}
            type="button"
          >
            <span className="flex size-4 items-center justify-center text-muted-foreground">
              —
            </span>
            Divider
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => {
              editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
              setInsertOpen(false);
            }}
            type="button"
          >
            <ChevronDownIcon className="size-4 text-muted-foreground" />
            Collapsible
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
