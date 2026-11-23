import type { LexicalEditor } from "lexical";
import type { LucideIcon } from "lucide-react";

export type CoreSlashCommandId =
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
  | "hr"
  | "callout"
  | "info"
  | "tip"
  | "warning"
  | "caution";

/**
 * Built-in slash command ids plus open string extension so consumer
 * `extraFeatures` can register custom commands without TypeScript errors.
 */
export type SlashCommandId =
  | CoreSlashCommandId
  | (string & Record<never, never>);

export type SlashCommandSelection = SlashCommandId | "";

export interface SlashCommand {
  description: string;
  icon: LucideIcon;
  id: SlashCommandId;
  keywords: string[];
  label: string;
}

/**
 * A slash-menu contribution from a feature descriptor: the rendered menu
 * entry plus what happens when the consumer selects it. Runs receive the
 * editor so features can dispatch their own insert commands or mutate the
 * document directly.
 */
export interface FeatureSlashCommand {
  command: SlashCommand;
  run: (editor: LexicalEditor) => void;
}

export interface SlashMenuPosition {
  left: number;
  top: number;
}

export interface SlashMenuAnchor {
  getBoundingClientRect: () => DOMRect;
  getClientRects: () => DOMRectList;
}
