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
  | "image"
  | "youtube"
  | "collapsible"
  | "columns"
  | "table"
  | "hr";

export type SlashCommandSelection = SlashCommandId | "";

export interface SlashCommand {
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
