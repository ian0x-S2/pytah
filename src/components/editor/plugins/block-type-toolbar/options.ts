import type { LucideIcon } from "lucide-react";
import {
  AlertTriangleIcon,
  CalculatorIcon,
  ChevronRightIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  InfoIcon,
  LightbulbIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  NotebookPenIcon,
  PanelsTopLeftIcon,
  PencilRulerIcon,
  PlayIcon,
  QuoteIcon,
  ShieldAlertIcon,
  SquareCheckIcon,
  TableIcon,
  TypeIcon,
} from "lucide-react";

import type {
  CoreSlashCommandId,
  FeatureSlashCommand,
} from "../slash-command/types";
import type { BlockOption, BlockTypeValue } from "./types";

const CORE_BLOCK_TYPES = new Set<string>([
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

export const BLOCK_TYPE_ORDER: CoreSlashCommandId[] = [
  "paragraph",
  "h1",
  "h2",
  "h3",
  "bullet",
  "number",
  "check",
  "quote",
  "code",
  "callout",
  "info",
  "tip",
  "warning",
  "caution",
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
  CoreSlashCommandId,
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
  callout: {
    description: "Highlighted callout box",
    icon: NotebookPenIcon,
    label: "Callout",
  },
  caution: {
    description: "Critical caution callout",
    icon: ShieldAlertIcon,
    label: "Caution",
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
  info: {
    description: "Informational callout box",
    icon: InfoIcon,
    label: "Info",
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
  tip: {
    description: "Helpful tip callout",
    icon: LightbulbIcon,
    label: "Tip",
  },
  warning: {
    description: "Warning alert callout",
    icon: AlertTriangleIcon,
    label: "Warning",
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
  icon: BLOCK_METADATA[value].icon,
  label: BLOCK_METADATA[value].label,
  value,
}));

export const getAvailableBlockOptions = (
  commandIds: readonly string[],
  extraCommands?: readonly FeatureSlashCommand[]
): BlockOption[] => {
  const idSet = new Set(commandIds);
  const builtIns = BLOCK_OPTIONS.filter(
    (option) => option.alwaysOn || idSet.has(option.value)
  );
  const knownIds = new Set<string>(BLOCK_TYPE_ORDER);

  if (!extraCommands || extraCommands.length === 0) {
    return builtIns;
  }

  const customOptions: BlockOption[] = [];
  for (const { command } of extraCommands) {
    if (!knownIds.has(command.id) && idSet.has(command.id)) {
      customOptions.push({
        description: command.description,
        icon: command.icon,
        label: command.label,
        value: command.id,
      });
    }
  }

  return [...builtIns, ...customOptions];
};

export const BLOCK_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  BLOCK_TYPE_ORDER.map((value) => [value, BLOCK_METADATA[value].icon])
);

export const BLOCK_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPE_ORDER.map((value) => [value, BLOCK_METADATA[value].label])
);

/** Options rendered under an "Insert" section instead of conversion lists. */
export const INSERT_SECTION_TYPES = new Set<string>([
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
