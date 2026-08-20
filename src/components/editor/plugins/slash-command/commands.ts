import {
  CalculatorIcon,
  ChevronRightIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PanelsTopLeftIcon,
  PlayIcon,
  SquareCheckIcon,
  TableIcon,
  TextQuoteIcon,
  TypeIcon,
} from "lucide-react";
import type { SlashCommand } from "./types";

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    description: "Plain text block",
    icon: TypeIcon,
    id: "paragraph",
    keywords: ["text", "plain", "p"],
    label: "Paragraph",
    alwaysOn: true,
  },
  {
    description: "Large section heading",
    icon: Heading1Icon,
    id: "h1",
    keywords: ["title", "heading", "h1"],
    label: "Heading 1",
    alwaysOn: true,
  },
  {
    description: "Medium section heading",
    icon: Heading2Icon,
    id: "h2",
    keywords: ["subtitle", "heading", "h2"],
    label: "Heading 2",
    alwaysOn: true,
  },
  {
    description: "Small section heading",
    icon: Heading3Icon,
    id: "h3",
    keywords: ["heading", "h3"],
    label: "Heading 3",
    alwaysOn: true,
  },
  {
    description: "Capture a quote",
    icon: TextQuoteIcon,
    id: "quote",
    keywords: ["blockquote", "quote", "citation"],
    label: "Blockquote",
    alwaysOn: true,
  },
  {
    description: "Write a code snippet",
    icon: CodeIcon,
    id: "code",
    keywords: ["code", "snippet", "pre"],
    label: "Code Block",
    alwaysOn: true,
  },
  {
    description: "Unordered list",
    icon: ListIcon,
    id: "bullet",
    keywords: ["list", "bullet", "unordered", "ul"],
    label: "Bullet List",
    alwaysOn: true,
  },
  {
    description: "Ordered list",
    icon: ListOrderedIcon,
    id: "number",
    keywords: ["list", "ordered", "numbered", "ol"],
    label: "Numbered List",
    alwaysOn: true,
  },
  {
    description: "Todo list with checkboxes",
    icon: SquareCheckIcon,
    id: "check",
    keywords: ["check", "checklist", "todo", "task"],
    label: "Checklist",
    alwaysOn: true,
  },
  {
    description: "Insert TeX math equation",
    icon: CalculatorIcon,
    id: "math",
    keywords: ["math", "latex", "katex", "equation", "formula", "tex"],
    label: "Math Block",
  },
  {
    description: "Insert an image from URL",
    icon: ImageIcon,
    id: "image",
    keywords: ["image", "photo", "media", "picture", "img"],
    label: "Image",
  },
  {
    description: "Embed a YouTube video",
    icon: PlayIcon,
    id: "youtube",
    keywords: ["youtube", "video", "embed", "yt"],
    label: "YouTube",
  },
  {
    description: "Expandable toggle section",
    icon: ChevronRightIcon,
    id: "collapsible",
    keywords: ["collapsible", "toggle", "details", "accordion"],
    label: "Collapsible",
  },
  {
    description: "Multi-column content layout",
    icon: PanelsTopLeftIcon,
    id: "columns",
    keywords: ["columns", "layout", "grid", "multi-column"],
    label: "Columns",
  },
  {
    description: "Simple editable table",
    icon: TableIcon,
    id: "table",
    keywords: ["table", "grid", "cells", "columns", "rows"],
    label: "Table",
  },
  {
    description: "Horizontal rule separator",
    icon: MinusIcon,
    id: "hr",
    keywords: ["divider", "separator", "hr", "line"],
    label: "Divider",
    alwaysOn: true,
  },
];

/**
 * Slash commands that are always shown regardless of feature toggles. These
 * are the base block types (paragraph, headings, lists, quote, code, divider)
 * that every editor ships. Feature-gated commands are contributed through the
 * resolved `ids` argument instead.
 */
const ALWAYS_ON_SLASH_COMMANDS = SLASH_COMMANDS.filter(
  (command) => command.alwaysOn
);

export const getSlashCommandsForIds = (
  ids: readonly string[]
): SlashCommand[] => {
  const idSet = new Set<string>(ids);

  const featureCommands = SLASH_COMMANDS.filter((command) => {
    return !command.alwaysOn && idSet.has(command.id);
  });

  return [...ALWAYS_ON_SLASH_COMMANDS, ...featureCommands];
};
