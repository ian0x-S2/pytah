import {
  FileTextIcon,
  KeyboardIcon,
  ListTreeIcon,
  SparklesIcon,
} from "lucide-react";

export const DEFAULT_PLACEHOLDER =
  "Type / for commands, or just start writing...";

export const WORD_SEPARATOR_PATTERN = /\s+/;

export const FEATURE_ITEMS = [
  {
    icon: SparklesIcon,
    label: "Slash commands",
    description: "Quick insert menu inspired by Notion.",
  },
  {
    icon: KeyboardIcon,
    label: "Markdown shortcuts",
    description: "Type #, -, > and more to format while writing.",
  },
  {
    icon: ListTreeIcon,
    label: "Block toolbar",
    description: "Change block type, alignment and indentation fast.",
  },
  {
    icon: FileTextIcon,
    label: "Markdown export",
    description: "Always keep HTML, markdown and plain text in sync.",
  },
] as const;

export const DEFAULT_EDITOR_MARKDOWN = [
  "# Pytah editor",
  "",
  "A copy-paste-ready Notion-like editor built with Lexical, shadcn and Base UI.",
  "",
  "## What works",
  "",
  "- Slash commands with synced highlight and scrolling",
  "- Floating inline toolbar for marks and links",
  "- Block toolbar for headings, lists, quote and code",
  "- Markdown shortcuts and export",
  "- HTML output ready to copy into other apps",
  "",
  "> Try typing /, select a block and keep writing.",
].join("\n");

export const MARKDOWN_EXAMPLE = [
  "# Markdown import",
  "",
  "Paste markdown here and keep editing visually.",
  "",
  "- bullet one",
  "- bullet two",
  "",
  "```ts",
  "const ready = true;",
  "```",
].join("\n");

export const HTML_EXAMPLE = [
  "<h1>Imported HTML</h1>",
  "<p>This content was inserted as HTML and normalized by Lexical.</p>",
  "<ul><li>Lists stay editable</li><li>Formatting remains semantic</li></ul>",
  "<blockquote>Great editors should be easy to paste into and out of.</blockquote>",
].join("");
