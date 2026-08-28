import type { ReactNode } from "react";
import type {
  EditorChromeOptions,
  EditorFeatureFlags,
  EditorSnapshotOptions,
} from "./types";

export const DEFAULT_EDITOR_SNAPSHOT_OPTIONS = {
  emitInitialSnapshot: true,
  html: true,
  markdown: true,
  text: true,
} as const satisfies Required<EditorSnapshotOptions>;

export type ResolvedEditorSnapshotOptions = Required<EditorSnapshotOptions>;

export const resolveEditorSnapshotOptions = (
  options?: EditorSnapshotOptions
): ResolvedEditorSnapshotOptions => {
  return {
    ...DEFAULT_EDITOR_SNAPSHOT_OPTIONS,
    ...options,
  };
};

export type ResolvedEditorFeatureFlags = Required<
  Omit<EditorFeatureFlags, "snapshot">
> & {
  snapshot: ResolvedEditorSnapshotOptions;
};
export type ResolvedEditorChromeOptions = Required<EditorChromeOptions>;

export const DEFAULT_EDITOR_FEATURES = {
  exportMarkdown: true,
  floatingLinkEditor: true,
  floatingToolbar: true,
  focusOnMount: true,
  history: true,
  markdownShortcuts: true,
  slashCommand: true,
  snapshot: DEFAULT_EDITOR_SNAPSHOT_OPTIONS,
  tabIndentation: true,
} as const satisfies ResolvedEditorFeatureFlags;

export const DEFAULT_EDITOR_CHROME = {
  actionBar: true,
  footer: true,
  header: true,
  outputs: true,
  shell: true,
} as const satisfies Required<EditorChromeOptions>;

export const resolveEditorFeatures = (
  features?: EditorFeatureFlags
): ResolvedEditorFeatureFlags => {
  const { snapshot, ...flags } = features ?? {};

  return {
    ...DEFAULT_EDITOR_FEATURES,
    ...flags,
    // The nested snapshot bag is resolved separately so a partial override
    // (e.g. `{ html: false }`) never loses the sibling defaults.
    snapshot: resolveEditorSnapshotOptions(snapshot),
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

export const shouldRenderEditorShell = ({
  chromeShell,
  minimal,
  shellSlot,
}: {
  chromeShell: boolean;
  minimal: boolean;
  shellSlot:
    | ReactNode
    | ((context: { children: ReactNode }) => ReactNode)
    | undefined;
}) => {
  if (shellSlot !== undefined) {
    return true;
  }

  if (minimal) {
    return false;
  }

  return chromeShell;
};
