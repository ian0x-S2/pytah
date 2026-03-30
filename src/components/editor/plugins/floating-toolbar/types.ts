export interface FloatingToolbarFormatState {
  isBold: boolean;
  isCode: boolean;
  isItalic: boolean;
  isLink: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
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
