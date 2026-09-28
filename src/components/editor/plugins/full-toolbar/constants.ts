import {
  BoldIcon,
  CodeIcon,
  HighlighterIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

// Align actions are shared with the floating toolbar's secondary row; the
// floating folder owns the list, the full toolbar only re-exports it.
export { TOOLBAR_ALIGN_ACTIONS as ALIGN_ACTIONS } from "../floating-toolbar/constants";

export const INLINE_FORMAT_ACTIONS = [
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
