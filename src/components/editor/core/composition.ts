import type { ReactNode } from "react";
import type { EditorChromeOptions, EditorFeatureFlags } from "./types";

export const DEFAULT_EDITOR_FEATURES = {
  collapsible: true,
  draggableBlocks: true,
  floatingLinkEditor: true,
  floatingToolbar: true,
  focusOnMount: true,
  history: true,
  images: true,
  layouts: true,
  markdownShortcuts: true,
  seedContent: true,
  slashCommand: true,
  tabIndentation: true,
  tables: true,
  youtube: true,
} as const satisfies Required<EditorFeatureFlags>;

export const DEFAULT_EDITOR_CHROME = {
  actionBar: true,
  footer: true,
  header: true,
  outputs: true,
  shell: true,
} as const satisfies Required<EditorChromeOptions>;

export type ResolvedEditorFeatureFlags = Required<EditorFeatureFlags>;
export type ResolvedEditorChromeOptions = Required<EditorChromeOptions>;

export const resolveEditorFeatures = (
  features?: EditorFeatureFlags
): ResolvedEditorFeatureFlags => {
  return {
    ...DEFAULT_EDITOR_FEATURES,
    ...features,
  };
};

export const resolveEditorChrome = (
  chrome?: EditorChromeOptions
): ResolvedEditorChromeOptions => {
  return {
    ...DEFAULT_EDITOR_CHROME,
    ...chrome,
  };
};

export const renderEditorSlot = <T>(
  slot: ReactNode | ((context: T) => ReactNode) | undefined,
  context: T
): ReactNode | undefined => {
  if (typeof slot === "function") {
    return slot(context);
  }

  return slot;
};
