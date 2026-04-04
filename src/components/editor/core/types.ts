import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import type { ReactNode } from "react";

export interface EditorSnapshot {
  html: string;
  markdown: string;
  text: string;
}

export interface EditorActionBarControls {
  onLoadHtml: () => void;
  onLoadMarkdown: () => void;
  onReset: () => void;
}

export interface EditorFooterContext {
  snapshot: EditorSnapshot;
}

export interface EditorOutputContext {
  onCopyHtml: () => void;
  onCopyMarkdown: () => void;
  snapshot: EditorSnapshot;
}

export interface EditorShellContext {
  children: ReactNode;
}

export interface EditorFeatureFlags {
  draggableBlocks?: boolean;
  floatingLinkEditor?: boolean;
  floatingToolbar?: boolean;
  focusOnMount?: boolean;
  history?: boolean;
  markdownShortcuts?: boolean;
  seedContent?: boolean;
  slashCommand?: boolean;
  tabIndentation?: boolean;
}

export interface EditorChromeOptions {
  actionBar?: boolean;
  footer?: boolean;
  header?: boolean;
  outputs?: boolean;
  shell?: boolean;
}

export interface EditorPluginSlots {
  afterDefault?: ReactNode;
  afterEditable?: ReactNode;
  beforeDefault?: ReactNode;
  beforeEditable?: ReactNode;
}

export interface EditorChromeSlots {
  actionBar?: ReactNode | ((controls: EditorActionBarControls) => ReactNode);
  footer?: ReactNode | ((context: EditorFooterContext) => ReactNode);
  header?: ReactNode;
  outputs?: ReactNode | ((context: EditorOutputContext) => ReactNode);
  shell?: ReactNode | ((context: EditorShellContext) => ReactNode);
  topToolbar?: ReactNode;
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
  chrome?: EditorChromeOptions;
  className?: string;
  contentClassName?: string;
  editable?: boolean;
  extraNodes?: NonNullable<InitialConfigType["nodes"]>;
  features?: EditorFeatureFlags;
  initialHtml?: string;
  initialMarkdown?: string;
  minimal?: boolean;
  namespace?: string;
  onChange?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder?: string;
  pluginSlots?: EditorPluginSlots;
  slots?: EditorChromeSlots;
  /** @default false */
  toolbar?: EditorToolbar;
}
