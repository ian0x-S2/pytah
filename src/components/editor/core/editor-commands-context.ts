import { createContext, useContext } from "react";

import type { FeatureSlashCommand } from "../plugins/slash-command/types";

/**
 * Slash command ids resolved from the enabled feature set (core plus
 * installed extras). Shared chrome (dropdowns, insert menus) reads this to
 * feature-gate its options without any static import from feature folders.
 */
export const EditorResolvedCommandsContext = createContext<readonly string[]>(
  []
);

/**
 * Per-editor resolved command entries (metadata + runner). Scoped to each
 * editor instance via React Context so multiple concurrent editors never
 * collide or clobber each other's runners on unmount.
 */
export const EditorCommandsContext = createContext<
  readonly FeatureSlashCommand[]
>([]);

export const useEditorResolvedCommands = (): readonly string[] =>
  useContext(EditorResolvedCommandsContext);

export const useEditorCommands = (): readonly FeatureSlashCommand[] =>
  useContext(EditorCommandsContext);

export const useEditorCommandRunner = (
  id: string
): FeatureSlashCommand["run"] | undefined => {
  const commands = useContext(EditorCommandsContext);
  return commands.find((entry) => entry.command.id === id)?.run;
};

/**
 * Exposes whether the floating link editor plugin is enabled for the active
 * editor instance so toolbars do not dispatch unhandled link-editor commands.
 */
export const EditorFloatingLinkEnabledContext = createContext<boolean>(true);

export const useEditorFloatingLinkEnabled = (): boolean =>
  useContext(EditorFloatingLinkEnabledContext);
