export interface FloatingToolbarFormatState {
  /** Current background-color CSS value of the selection, or "" if none/mixed. */
  bgColor: string;
  isBold: boolean;
  isCode: boolean;
  isHighlight: boolean;
  isItalic: boolean;
  isLink: boolean;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isUnderline: boolean;
  /** Current color CSS value of the selection, or "" if none/mixed. */
  textColor: string;
}

export interface FloatingToolbarPosition {
  left: number;
  top: number;
}

export interface FloatingToolbarState {
  formats: FloatingToolbarFormatState;
  isVisible: boolean;
  linkUrl: string;
  position: FloatingToolbarPosition;
}
