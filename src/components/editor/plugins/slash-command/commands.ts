import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  SquareCheckIcon,
  TableIcon,
  TextQuoteIcon,
  TypeIcon,
} from "lucide-react";
import type { SlashCommand } from "./types";

export const SLASH_COMMAND_PATTERN = /^\/(\w*)$/;

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    description: "Plain text block",
    icon: TypeIcon,
    id: "paragraph",
    keywords: ["text", "plain", "p"],
    label: "Paragraph",
  },
  {
    description: "Large section heading",
    icon: Heading1Icon,
    id: "h1",
    keywords: ["title", "heading", "h1"],
    label: "Heading 1",
  },
  {
    description: "Medium section heading",
    icon: Heading2Icon,
    id: "h2",
    keywords: ["subtitle", "heading", "h2"],
    label: "Heading 2",
  },
  {
    description: "Small section heading",
    icon: Heading3Icon,
    id: "h3",
    keywords: ["heading", "h3"],
    label: "Heading 3",
  },
  {
    description: "Capture a quote",
    icon: TextQuoteIcon,
    id: "quote",
    keywords: ["blockquote", "quote", "citation"],
    label: "Blockquote",
  },
  {
    description: "Write a code snippet",
    icon: CodeIcon,
    id: "code",
    keywords: ["code", "snippet", "pre"],
    label: "Code Block",
  },
  {
    description: "Unordered list",
    icon: ListIcon,
    id: "bullet",
    keywords: ["list", "bullet", "unordered", "ul"],
    label: "Bullet List",
  },
  {
    description: "Ordered list",
    icon: ListOrderedIcon,
    id: "number",
    keywords: ["list", "ordered", "numbered", "ol"],
    label: "Numbered List",
  },
  {
    description: "Todo list with checkboxes",
    icon: SquareCheckIcon,
    id: "check",
    keywords: ["check", "checklist", "todo", "task"],
    label: "Checklist",
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
  },
];
