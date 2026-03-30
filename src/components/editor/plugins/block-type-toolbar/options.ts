import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareCheckIcon,
  TableIcon,
  TextIcon,
} from "lucide-react";
import type { BlockOption, BlockTypeValue } from "./types";

export const BLOCK_OPTIONS: BlockOption[] = [
  {
    description: "Regular paragraph",
    label: "Text",
    value: "paragraph",
  },
  {
    description: "Main section title",
    label: "Heading 1",
    value: "h1",
  },
  {
    description: "Section heading",
    label: "Heading 2",
    value: "h2",
  },
  {
    description: "Subsection heading",
    label: "Heading 3",
    value: "h3",
  },
  {
    description: "Unordered list",
    label: "Bullet list",
    value: "bullet",
  },
  {
    description: "Ordered list",
    label: "Numbered list",
    value: "number",
  },
  {
    description: "Todo items with checkboxes",
    label: "Checklist",
    value: "check",
  },
  {
    description: "Blockquote",
    label: "Quote",
    value: "quote",
  },
  {
    description: "Monospace code block",
    label: "Code block",
    value: "code",
  },
  {
    description: "Simple editable table",
    label: "Table",
    value: "table",
  },
];

export const BLOCK_LABELS: Record<BlockTypeValue, string> = {
  bullet: "Bullet list",
  check: "Checklist",
  code: "Code block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  number: "Numbered list",
  paragraph: "Text",
  quote: "Quote",
  table: "Table",
};

export const BLOCK_ICONS = {
  bullet: ListIcon,
  check: SquareCheckIcon,
  code: PilcrowIcon,
  h1: Heading1Icon,
  h2: Heading2Icon,
  h3: Heading3Icon,
  number: ListOrderedIcon,
  paragraph: TextIcon,
  quote: QuoteIcon,
  table: TableIcon,
} as const;
