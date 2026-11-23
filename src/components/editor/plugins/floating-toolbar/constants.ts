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

import type {
  FloatingToolbarFormatState,
  FloatingToolbarPosition,
} from "./types";

export const EMPTY_TOOLBAR_POSITION: FloatingToolbarPosition = {
  left: 0,
  top: 0,
};

/** Inline text formatting actions shared by the floating and full toolbars. */
export const TOOLBAR_FORMAT_ACTIONS = [
  { format: "bold", icon: BoldIcon, key: "isBold", label: "Bold" },
  { format: "italic", icon: ItalicIcon, key: "isItalic", label: "Italic" },
  {
    format: "underline",
    icon: UnderlineIcon,
    key: "isUnderline",
    label: "Underline",
  },
  {
    format: "strikethrough",
    icon: StrikethroughIcon,
    key: "isStrikethrough",
    label: "Strikethrough",
  },
  {
    format: "highlight",
    icon: HighlighterIcon,
    key: "isHighlight",
    label: "Highlight",
  },
  { format: "code", icon: CodeIcon, key: "isCode", label: "Inline code" },
] as const;

/** Block-level alignment actions shared by both toolbar rows. */
export const TOOLBAR_ALIGN_ACTIONS = [
  { align: "left" as const, icon: AlignLeftIcon, label: "Align left" },
  { align: "center" as const, icon: AlignCenterIcon, label: "Align center" },
  { align: "right" as const, icon: AlignRightIcon, label: "Align right" },
  { align: "justify" as const, icon: AlignJustifyIcon, label: "Justify" },
];

export const DEFAULT_FORMAT_STATE: FloatingToolbarFormatState = {
  bgColor: "",
  elementFormat: "",
  isBold: false,
  isCode: false,
  isHighlight: false,
  isItalic: false,
  isLink: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isUnderline: false,
  textColor: "",
};
