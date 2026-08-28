import type { Transformer } from "@lexical/markdown";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import type { ComponentType, ReactNode } from "react";
import type { FeatureSlashCommand } from "../plugins/slash-command/types";

/**
 * A serialized view of the current editor document. Fields stay `string`
 * unconditionally: an output disabled through `features.snapshot` is never
 * computed and surfaces as `""` — it is a placeholder, not empty content.
 */
export interface EditorSnapshot {
  html: string;
  markdown: string;
  text: string;
}

/**
 * Selective snapshot serialization. Every option defaults to `true`
 * (backward compatible); a disabled output is skipped entirely instead of
 * being computed and discarded.
 */
export interface EditorSnapshotOutputs {
  /** Serialize HTML into `snapshot.html`. @default true */
  html?: boolean;
  /** Serialize markdown into `snapshot.markdown`. @default true */
  markdown?: boolean;
  /** Serialize plain text into `snapshot.text`. @default true */
  text?: boolean;
}

export interface EditorSnapshotOptions extends EditorSnapshotOutputs {
  /**
   * Emit `onChange`/`onSnapshotReady` for the initial programmatic seed
   * (`initialMarkdown`/`initialHtml`). @default true
   */
  emitInitialSnapshot?: boolean;
}

export interface EditorActionBarControls {
  onExportMarkdown?: () => void;
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
  exportMarkdown?: boolean;
  floatingLinkEditor?: boolean;
  floatingToolbar?: boolean;
  focusOnMount?: boolean;
  history?: boolean;
  markdownShortcuts?: boolean;
  slashCommand?: boolean;
  /**
   * Selective snapshot serialization. Disable the outputs a consumer never
   * reads to skip their per-keystroke serialization cost entirely.
   */
  snapshot?: EditorSnapshotOptions;
  tabIndentation?: boolean;
}

/**
 * A feature contributed by a consumer at composition time. Each capability is
 * described once and its nodes, plugin, transformers and slash commands are
 * wired together by the composition surface — no internal file edits needed.
 *
 * Content features (images, tables, drawings, ...) are shipped as separate
 * registry items and composed through this interface; nothing in `core/`
 * imports them statically, so uninstalled features never reach the bundle.
 */
export interface ExtraEditorFeature {
  /** Only mount the plugin when the editor is editable. */
  editableOnly?: boolean;
  id: string;
  /** Lexical nodes contributed by the feature. */
  nodes?: NonNullable<InitialConfigType["nodes"]>;
  /** The behavior plugin to mount on the editor. */
  plugin?: ComponentType;
  /** Slash-menu entries this feature adds to the shared insert menu. */
  slashCommands?: readonly FeatureSlashCommand[];
  /** Markdown transformers contributed by the feature. */
  transformers?: Transformer[];
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
  extraFeatures?: ExtraEditorFeature[];
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
