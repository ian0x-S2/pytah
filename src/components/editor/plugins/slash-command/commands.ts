import type { LucideIcon } from "lucide-react";
import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  SquareCheckIcon,
  TableIcon,
  TypeIcon,
} from "lucide-react";
import type { SlashCommandId } from "./types";

export interface SlashCommandEntry {
  description: string;
  icon: LucideIcon;
  id: SlashCommandId;
  keywords: string[];
  label: string;
}

/**
 * Core-owned slash commands. Every base editor ships these regardless of
 * which feature items are installed — block types plus divider and table
 * insertion (`TableNode` is part of the core node set so pasted tables never
 * drop). Feature-scoped entries come from feature descriptors instead.
 */
export const CORE_SLASH_COMMANDS: readonly {
  description: string;
  icon: LucideIcon;
  id: SlashCommandId;
  keywords: string[];
  label: string;
}[] = [
  {
    description: "Empty block",
    icon: TypeIcon,
    id: "paragraph",
    keywords: ["plain", "text", "paragraph", "p"],
    label: "Text",
  },
  {
    description: "Big heading",
    icon: Heading1Icon,
    id: "h1",
    keywords: ["h1", "heading", "title", "large"],
    label: "Heading 1",
  },
  {
    description: "Medium heading",
    icon: Heading2Icon,
    id: "h2",
    keywords: ["h2", "heading", "subtitle", "medium"],
    label: "Heading 2",
  },
  {
    description: "Small heading",
    icon: Heading3Icon,
    id: "h3",
    keywords: ["h3", "heading", "small"],
    label: "Heading 3",
  },
  {
    description: "Block quote",
    icon: QuoteIcon,
    id: "quote",
    keywords: ["blockquote", "citation", "quote"],
    label: "Quote",
  },
  {
    description: "Code block",
    icon: CodeIcon,
    id: "code",
    keywords: ["code", "snippet", "pre"],
    label: "Code Block",
  },
  {
    description: "Bulleted list",
    icon: ListIcon,
    id: "bullet",
    keywords: ["bullet", "list", "unordered", "ul"],
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
