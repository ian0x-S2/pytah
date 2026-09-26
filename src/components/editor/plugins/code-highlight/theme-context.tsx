"use client";

import { createContext, useContext } from "react";

import type { CodeBlockThemeFamily } from "./themes/registry";

export interface CodeBlockThemeContextValue {
  family: CodeBlockThemeFamily;
  setFamily: (family: CodeBlockThemeFamily) => void;
}

/**
 * Shared code-block theme state, provided by `EditorContent`. Null outside
 * a provider (standalone plugin renders); consumers fall back to the
 * default family. `useCodeBlockTheme` exposes the same state for custom
 * switchers anywhere inside the editor tree.
 */
export const CodeBlockThemeContext =
  createContext<CodeBlockThemeContextValue | null>(null);

export function useCodeBlockTheme(): CodeBlockThemeContextValue | null {
  return useContext(CodeBlockThemeContext);
}
