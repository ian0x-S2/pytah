import type { LexicalEditor } from "lexical";

export interface EditorSnapshot {
  html: string;
  markdown: string;
  text: string;
}

/**
 * Controls which toolbar is shown above the editor content area.
 *
 * - `false`    — no toolbar is rendered (default, fully opt-in)
 * - `"basic"`  — block-type selector, undo/redo, alignment, and indent controls
 * - `"full"`   — everything in "basic" plus inline formatting, text/bg colour
 *                pickers, and a link toggle in one single row
 */
export type EditorToolbar = false | "basic" | "full";

export interface EditorProps {
  className?: string;
  contentClassName?: string;
  editable?: boolean;
  initialHtml?: string;
  initialMarkdown?: string;
  minimal?: boolean;
  onChange?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder?: string;
  /** @default false */
  toolbar?: EditorToolbar;
}
