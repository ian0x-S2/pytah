import type {
  FloatingToolbarFormatState,
  FloatingToolbarPosition,
} from "./types";

export const EMPTY_TOOLBAR_POSITION: FloatingToolbarPosition = {
  left: 0,
  top: 0,
};

export const DEFAULT_FORMAT_STATE: FloatingToolbarFormatState = {
  isBold: false,
  isCode: false,
  isHighlight: false,
  isItalic: false,
  isLink: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isUnderline: false,
  bgColor: "",
  textColor: "",
};
