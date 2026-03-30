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
