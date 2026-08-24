import type { LucideIcon } from "lucide-react";
import { SLASH_COMMANDS } from "../slash-command/commands";
import type { BlockOption, BlockTypeValue } from "./types";

/** Toolbar dropdown options are derived from the slash command registry so
 * the two surfaces can never drift apart. Presentation copy is overridden
 * where the toolbar phrasing differs from the slash menu. */
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

const BLOCK_LABEL_OVERRIDES: Partial<Record<BlockTypeValue, string>> = {
  bullet: "Bullet list",
  check: "Checklist",
  code: "Code block",
  number: "Numbered list",
  paragraph: "Text",
  quote: "Quote",
};

const BLOCK_DESCRIPTION_OVERRIDES: Partial<Record<BlockTypeValue, string>> = {
  bullet: "Unordered list",
  check: "Todo items with checkboxes",
  code: "Monospace code block",
  columns: "Multi-column content layout",
  excalidraw: "Draw a diagram or sketch",
  h1: "Main section title",
  h2: "Section heading",
  h3: "Subsection heading",
  image: "Insert an image from URL or file",
  math: "Insert TeX math equation",
  number: "Ordered list",
  paragraph: "Regular paragraph",
  quote: "Blockquote",
  table: "Simple editable table",
  youtube: "Embed a YouTube video",
};

const commandById = new Map(
  SLASH_COMMANDS.map((command) => [command.id, command])
);

const toBlockOptions = (): BlockOption[] =>
  BLOCK_TYPE_ORDER.flatMap((value) => {
    const command = commandById.get(value);
    if (!command) {
      return [];
    }

    return [
      {
        alwaysOn: command.alwaysOn,
        description: BLOCK_DESCRIPTION_OVERRIDES[value] ?? command.description,
        label: BLOCK_LABEL_OVERRIDES[value] ?? command.label,
        value,
      },
    ];
  });

export const BLOCK_OPTIONS: BlockOption[] = toBlockOptions();

export const getAvailableBlockOptions = (
  commandIds: readonly string[]
): BlockOption[] => {
  const idSet = new Set(commandIds);

  return BLOCK_OPTIONS.filter(
    (option) => option.alwaysOn || idSet.has(option.value)
  );
};

const toIconMap = (): Record<BlockTypeValue, LucideIcon> => {
  const icons: Partial<Record<BlockTypeValue, LucideIcon>> = {};

  for (const option of BLOCK_OPTIONS) {
    const icon = commandById.get(option.value)?.icon;
    if (icon) {
      icons[option.value] = icon;
    }
  }

  return icons as Record<BlockTypeValue, LucideIcon>;
};

export const BLOCK_ICONS = toIconMap();

export const BLOCK_LABELS: Record<BlockTypeValue, string> = Object.fromEntries(
  BLOCK_OPTIONS.map((option) => [option.value, option.label])
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
