import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from "lucide-react";

import type {
  FloatingToolbarFormatState,
  FloatingToolbarPosition,
} from "./types";

export const EMPTY_TOOLBAR_POSITION: FloatingToolbarPosition = {
  left: 0,
  top: 0,
};

/** Block-level alignment actions shared by both toolbar rows. */
export const TOOLBAR_ALIGN_ACTIONS = [
  { align: "left" as const, icon: AlignLeftIcon, label: "Align left" },
  { align: "center" as const, icon: AlignCenterIcon, label: "Align center" },
  { align: "right" as const, icon: AlignRightIcon, label: "Align right" },
  { align: "justify" as const, icon: AlignJustifyIcon, label: "Justify" },
];

export const DEFAULT_FORMAT_STATE: FloatingToolbarFormatState = {
  bgColor: "",
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
