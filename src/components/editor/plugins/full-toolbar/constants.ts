import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CodeIcon,
  HighlighterIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";

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

export const ALIGN_ACTIONS = [
  { align: "left" as const, icon: AlignLeftIcon, label: "Align left" },
  { align: "center" as const, icon: AlignCenterIcon, label: "Align center" },
  { align: "right" as const, icon: AlignRightIcon, label: "Align right" },
  { align: "justify" as const, icon: AlignJustifyIcon, label: "Justify" },
];
