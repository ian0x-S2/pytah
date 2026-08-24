import type { LucideIcon } from "lucide-react";

export type SlashCommandId =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "code"
  | "bullet"
  | "number"
  | "check"
  | "math"
  | "image"
  | "youtube"
  | "excalidraw"
  | "collapsible"
  | "columns"
  | "table"
  | "hr";

export type SlashCommandSelection = SlashCommandId | "";

export interface SlashCommand {
  /** Always show regardless of feature toggles (base block types). */
  alwaysOn?: boolean;
  description: string;
  icon: LucideIcon;
  id: SlashCommandId;
  keywords: string[];
  label: string;
}

export interface SlashMenuPosition {
  left: number;
  top: number;
}

export interface SlashMenuAnchor {
  getBoundingClientRect: () => DOMRect;
  getClientRects: () => DOMRectList;
}
