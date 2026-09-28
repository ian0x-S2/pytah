import { createContext, useContext } from "react";

/**
 * Slash command ids resolved from the enabled feature set (core plus
 * installed extras). Shared chrome (dropdowns, insert menus) reads this to
 * feature-gate its options without any static import from feature folders.
 */
export const EditorResolvedCommandsContext = createContext<readonly string[]>(
  []
);

export const useEditorResolvedCommands = (): readonly string[] =>
  useContext(EditorResolvedCommandsContext);
