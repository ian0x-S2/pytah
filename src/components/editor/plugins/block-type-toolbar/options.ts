import type { LucideIcon } from "lucide-react";
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
  PencilRulerIcon,
  PlayIcon,
  QuoteIcon,
  SquareCheckIcon,
  TableIcon,
  TypeIcon,
} from "lucide-react";
import type { BlockOption, BlockTypeValue } from "./types";

/**
 * Toolbar dropdown metadata. Self-contained on purpose: the toolbar is core
 * chrome and must not import feature modules. Feature-gated options only
 * render when their command id was resolved from installed extras (see
 * `getAvailableBlockOptions`).
 */

/** Core block types every install ships; never gated by command ids. */
const CORE_BLOCK_TYPES = new Set<BlockTypeValue>([
  "paragraph",
  "h1",
  "h2",
  "h3",
  "bullet",
  "number",
  "check",
  "quote",
  "code",
  "table",
  "hr",
]);

export const BLOCK_TYPE_ORDER: BlockTypeValue[] = [
  "paragraph",
  "h1",
  "h2",
  "h3",
  "bullet",
  "number",
  "check",
  "quote",
  "code",
  "math",
  "image",
  "youtube",
  "excalidraw",
  "collapsible",
  "columns",
  "table",
  "hr",
];

const BLOCK_METADATA: Record<
  BlockTypeValue,
  {
    description: string;
    icon: LucideIcon;
    label: string;
  }
> = {
  bullet: {
    description: "Unordered list",
    icon: ListIcon,
    label: "Bullet list",
  },
  check: {
    description: "Todo items with checkboxes",
    icon: SquareCheckIcon,
    label: "Checklist",
  },
  code: {
    description: "Monospace code block",
    icon: CodeIcon,
    label: "Code block",
  },
  collapsible: {
    description: "Expandable toggle section",
    icon: ChevronRightIcon,
    label: "Collapsible",
  },
  columns: {
    description: "Multi-column content layout",
    icon: PanelsTopLeftIcon,
    label: "Columns",
  },
  excalidraw: {
    description: "Draw a diagram or sketch",
    icon: PencilRulerIcon,
    label: "Drawing",
  },
  h1: {
    description: "Main section title",
    icon: Heading1Icon,
    label: "Heading 1",
  },
  h2: {
    description: "Section heading",
    icon: Heading2Icon,
    label: "Heading 2",
  },
  h3: {
    description: "Subsection heading",
    icon: Heading3Icon,
    label: "Heading 3",
  },
  hr: {
    description: "Horizontal rule separator",
    icon: MinusIcon,
    label: "Divider",
  },
  image: {
    description: "Insert an image from URL or file",
    icon: ImageIcon,
    label: "Image",
  },
  math: {
    description: "Insert TeX math equation",
    icon: CalculatorIcon,
    label: "Math Block",
  },
  number: {
    description: "Ordered list",
    icon: ListOrderedIcon,
    label: "Numbered list",
  },
  paragraph: {
    description: "Regular paragraph",
    icon: TypeIcon,
    label: "Text",
  },
  quote: {
    description: "Block quote",
    icon: QuoteIcon,
    label: "Quote",
  },
  table: {
    description: "Simple editable table",
    icon: TableIcon,
    label: "Table",
  },
  youtube: {
    description: "Embed a YouTube video",
    icon: PlayIcon,
    label: "YouTube",
  },
};

export const BLOCK_OPTIONS: BlockOption[] = BLOCK_TYPE_ORDER.map((value) => ({
  alwaysOn: CORE_BLOCK_TYPES.has(value),
  description: BLOCK_METADATA[value].description,
  label: BLOCK_METADATA[value].label,
  value,
}));

export const getAvailableBlockOptions = (
  commandIds: readonly string[]
): BlockOption[] => {
  const idSet = new Set(commandIds);

  return BLOCK_OPTIONS.filter(
    (option) => option.alwaysOn || idSet.has(option.value)
  );
};

export const BLOCK_ICONS: Record<BlockTypeValue, LucideIcon> =
  Object.fromEntries(
    BLOCK_TYPE_ORDER.map((value) => [value, BLOCK_METADATA[value].icon])
  ) as Record<BlockTypeValue, LucideIcon>;

export const BLOCK_LABELS: Record<BlockTypeValue, string> = Object.fromEntries(
  BLOCK_TYPE_ORDER.map((value) => [value, BLOCK_METADATA[value].label])
) as Record<BlockTypeValue, string>;

/** Options rendered under an "Insert" section instead of conversion lists. */
export const INSERT_SECTION_TYPES = new Set<BlockTypeValue>([
  "collapsible",
  "columns",
  "excalidraw",
  "hr",
  "image",
  "math",
  "table",
  "youtube",
]);

/** Presentation order for insert-style actions across toolbar menus. */
export const INSERT_ACTION_ORDER: BlockTypeValue[] = [
  "table",
  "hr",
  "collapsible",
  "math",
  "image",
  "youtube",
  "excalidraw",
  "columns",
];
