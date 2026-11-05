"use client";

import { $createCodeHighlightNode } from "@lexical/code";
import type { CodeNode } from "@lexical/code";
import { $createLineBreakNode, $createTabNode } from "lexical";
import type { LexicalNode } from "lexical";
import {
  createHighlighterCoreSync,
  getTokenStyleObject,
  stringifyTokenStyle,
} from "shiki/core";
import type {
  HighlighterCore,
  LanguageRegistration,
  ThemedToken,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import { DEFAULT_CODE_LANGUAGE, normalizeCodeLanguageId } from "./languages";
import {
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  getCodeBlockBackground,
  getCodeBlockForeground,
  getFamilyCodeBlockThemeIds,
  normalizeCodeBlockThemeId,
  resolveCodeBlockThemeId,
  SHIKI_THEME_LOADERS,
} from "./themes/registry";
import type { CodeBlockThemeId } from "./themes/registry";

export interface Tokenizer {
  $tokenize: (codeNode: CodeNode, language?: string) => LexicalNode[];
  defaultLanguage: string;
}

export interface ShikiTokenSegment {
  style: string;
  text: string;
}

interface ShikiLanguageModule {
  default: LanguageRegistration | LanguageRegistration[];
}

/**
 * Fine-grained dynamic imports for the 21 syntax languages in
 * `CODE_BLOCK_LANGUAGES`. Plain text (`plaintext`) is handled natively by
 * Shiki core without loading a grammar.
 */
const SHIKI_LANGUAGE_LOADERS: Record<
  string,
  () => Promise<ShikiLanguageModule>
> = {
  bash: () => import("@shikijs/langs/bash"),
  css: () => import("@shikijs/langs/css"),
  diff: () => import("@shikijs/langs/diff"),
  dotenv: () => import("@shikijs/langs/dotenv"),
  go: () => import("@shikijs/langs/go"),
  html: () => import("@shikijs/langs/html"),
  http: () => import("@shikijs/langs/http"),
  ini: () => import("@shikijs/langs/ini"),
  javascript: () => import("@shikijs/langs/javascript"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  markdown: () => import("@shikijs/langs/markdown"),
  python: () => import("@shikijs/langs/python"),
  rust: () => import("@shikijs/langs/rust"),
  shellsession: () => import("@shikijs/langs/shellsession"),
  sql: () => import("@shikijs/langs/sql"),
  svelte: () => import("@shikijs/langs/svelte"),
  toml: () => import("@shikijs/langs/toml"),
  tsx: () => import("@shikijs/langs/tsx"),
  typescript: () => import("@shikijs/langs/typescript"),
  yaml: () => import("@shikijs/langs/yaml"),
};

let shikiHighlighter: HighlighterCore | null = null;
const pendingThemeLoads = new Map<CodeBlockThemeId, Promise<void>>();
const pendingLanguageLoads = new Map<string, Promise<void>>();

/**
 * Singleton fine-grained Shiki core highlighter backed by the pure-JS regex
 * engine (no Oniguruma WASM binary). Starts with zero themes and languages
 * loaded; callers load only the pre-selected chunks they actually use.
 */
export function getShikiHighlighter(): HighlighterCore {
  if (!shikiHighlighter) {
    shikiHighlighter = createHighlighterCoreSync({
      engine: createJavaScriptRegexEngine(),
      langs: [],
      themes: [],
    });
  }
  return shikiHighlighter;
}

export function isCodeThemeLoaded(theme?: string | null): boolean {
  const themeId = normalizeCodeBlockThemeId(theme);
  return getShikiHighlighter().getLoadedThemes().includes(themeId);
}

const loadThemeModule = async (themeId: CodeBlockThemeId): Promise<void> => {
  try {
    const mod = await SHIKI_THEME_LOADERS[themeId]();
    const highlighter = getShikiHighlighter();
    if (!highlighter.getLoadedThemes().includes(themeId)) {
      highlighter.loadThemeSync({
        ...mod.default,
        name: themeId,
      });
    }
  } finally {
    pendingThemeLoads.delete(themeId);
  }
};

export function loadCodeTheme(theme?: string | null): Promise<void> {
  const themeId = normalizeCodeBlockThemeId(theme);
  if (isCodeThemeLoaded(themeId)) {
    return Promise.resolve();
  }
  const existing = pendingThemeLoads.get(themeId);
  if (existing) {
    return existing;
  }
  const promise = loadThemeModule(themeId);
  pendingThemeLoads.set(themeId, promise);
  return promise;
}

/**
 * Loads the active theme and its sibling mode variant (when the family has
 * both light and dark themes) so subsequent `.dark` toggles re-tokenize
 * synchronously without waiting on a network/chunk boundary.
 */
export async function loadCodeThemeFamily(
  theme?: string | null
): Promise<void> {
  const familyIds = getFamilyCodeBlockThemeIds(theme);
  await Promise.all(familyIds.map((id) => loadCodeTheme(id)));
}

export function isCodeLanguageLoaded(language?: string | null): boolean {
  const normalized = normalizeCodeLanguageId(language);
  if (normalized === "plaintext") {
    return true;
  }
  return getShikiHighlighter().getLoadedLanguages().includes(normalized);
}

const loadLanguageModule = async (
  normalized: string,
  loader: () => Promise<ShikiLanguageModule>
): Promise<void> => {
  try {
    const mod = await loader();
    const highlighter = getShikiHighlighter();
    if (!highlighter.getLoadedLanguages().includes(normalized)) {
      highlighter.loadLanguageSync(mod.default);
    }
  } finally {
    pendingLanguageLoads.delete(normalized);
  }
};

export function loadCodeLanguage(language?: string | null): Promise<void> {
  const normalized = normalizeCodeLanguageId(language);
  if (isCodeLanguageLoaded(normalized)) {
    return Promise.resolve();
  }
  const existing = pendingLanguageLoads.get(normalized);
  if (existing) {
    return existing;
  }
  const loader =
    SHIKI_LANGUAGE_LOADERS[normalized] ??
    SHIKI_LANGUAGE_LOADERS[DEFAULT_CODE_LANGUAGE];
  if (!loader) {
    return Promise.resolve();
  }
  const promise = loadLanguageModule(normalized, loader);
  pendingLanguageLoads.set(normalized, promise);
  return promise;
}

const toTokenStyle = (token: ThemedToken): string =>
  stringifyTokenStyle(token.htmlStyle ?? getTokenStyleObject(token));

/**
 * Synchronously tokenizes `code` into styled per-line segments when both the
 * normalized language and theme are already loaded in the singleton
 * highlighter; returns `null` if either asset still needs to be loaded.
 */
export function tokenizeCodeLines(
  code: string,
  language?: string | null,
  theme?: string | null
): ShikiTokenSegment[][] | null {
  const normalizedLanguage = normalizeCodeLanguageId(language);
  const themeId = normalizeCodeBlockThemeId(theme);
  if (
    !isCodeThemeLoaded(themeId) ||
    !isCodeLanguageLoaded(normalizedLanguage)
  ) {
    return null;
  }
  const result = getShikiHighlighter().codeToTokens(code, {
    lang: normalizedLanguage,
    theme: themeId,
  });
  return result.tokens.map((line) =>
    line.map((token) => ({
      style: toTokenStyle(token),
      text: token.content,
    }))
  );
}

const mapTokenLinesToLexicalNodes = (
  lines: ShikiTokenSegment[][]
): LexicalNode[] => {
  const nodes: LexicalNode[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (lineIndex > 0) {
      nodes.push($createLineBreakNode());
    }
    const line = lines[lineIndex] ?? [];
    for (const token of line) {
      const parts = token.text.split("\t");
      for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
        if (partIndex > 0) {
          nodes.push($createTabNode());
        }
        const part = parts[partIndex] ?? "";
        if (part !== "") {
          const node = $createCodeHighlightNode(part);
          if (token.style !== "") {
            node.setStyle(token.style);
          }
          nodes.push(node);
        }
      }
    }
  }
  return nodes;
};

/**
 * Lexical `Tokenizer` backed by the fine-grained Shiki core singleton.
 * Reads `CodeNode.getTheme()` for the resolved theme id and sets the block's
 * background/foreground inline style plus per-token inline styles.
 */
export const ShikiTokenizer: Tokenizer = {
  $tokenize(codeNode: CodeNode, language?: string): LexicalNode[] {
    const fallbackTheme = resolveCodeBlockThemeId(
      DEFAULT_CODE_BLOCK_THEME_FAMILY,
      "dark"
    );
    const themeId = normalizeCodeBlockThemeId(
      codeNode.getTheme() ?? fallbackTheme
    );
    const normalizedLanguage = normalizeCodeLanguageId(
      language ?? codeNode.getLanguage()
    );
    if (
      !isCodeThemeLoaded(themeId) ||
      !isCodeLanguageLoaded(normalizedLanguage)
    ) {
      throw new Error(
        `Shiki assets not loaded for theme "${themeId}" or language "${normalizedLanguage}"`
      );
    }

    const background = getCodeBlockBackground(themeId);
    const foreground = getCodeBlockForeground(themeId);
    const blockStyle = `background-color: ${background}; color: ${foreground};`;
    if (codeNode.getStyle() !== blockStyle) {
      codeNode.setStyle(blockStyle);
    }

    const code = codeNode.getTextContent();
    if (code === "") {
      return [];
    }

    const lines = tokenizeCodeLines(code, normalizedLanguage, themeId);
    if (!lines) {
      throw new Error(
        `Failed to tokenize with theme "${themeId}" and language "${normalizedLanguage}"`
      );
    }
    return mapTokenLinesToLexicalNodes(lines);
  },
  defaultLanguage: DEFAULT_CODE_LANGUAGE,
};
