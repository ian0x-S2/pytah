"use client";

import { $createCodeHighlightNode } from "@lexical/code";
import type { CodeNode } from "@lexical/code";
import type { Tokenizer } from "@lexical/code-shiki";
import { tokenize as tokenizeBash } from "@twinkleplop/bash";
import { tokenize as tokenizeCss } from "@twinkleplop/css";
import { tokenize as tokenizeDiff } from "@twinkleplop/diff";
import { tokenize as tokenizeDotenv } from "@twinkleplop/dotenv";
import { tokenize as tokenizeGo } from "@twinkleplop/go";
import { tokenize as tokenizeHtml } from "@twinkleplop/html";
import { tokenize as tokenizeHttp } from "@twinkleplop/http";
import { tokenize as tokenizeIni } from "@twinkleplop/ini";
import { tokenize as tokenizeJavascript } from "@twinkleplop/javascript";
import { tokenize as tokenizeJson } from "@twinkleplop/json";
import { tokenize as tokenizeJsonc } from "@twinkleplop/jsonc";
import { tokenize as tokenizeMarkdown } from "@twinkleplop/markdown";
import { tokenize as tokenizePython } from "@twinkleplop/python";
import { tokenize as tokenizeRust } from "@twinkleplop/rust";
import { tokenize as tokenizeShellsession } from "@twinkleplop/shellsession";
import { tokenize as tokenizeSql } from "@twinkleplop/sql";
import { tokenize as tokenizeSvelte } from "@twinkleplop/svelte";
import { dark, light } from "@twinkleplop/theme-github/tokens";
import { tokenize as tokenizeToml } from "@twinkleplop/toml";
import { tokenize as tokenizeTsx } from "@twinkleplop/tsx";
import { tokenize as tokenizeTypescript } from "@twinkleplop/typescript";
import { tokenize as tokenizeYaml } from "@twinkleplop/yaml";
import { $createLineBreakNode, $createTabNode } from "lexical";
import type { LexicalNode } from "lexical";

import { CODE_LANGUAGE_ALIASES, DEFAULT_CODE_LANGUAGE } from "./languages";

type TokenizeFn = ReturnType<typeof tokenizeTypescript>;

const TOKENIZERS: Record<string, TokenizeFn> = {
  bash: tokenizeBash(),
  css: tokenizeCss(),
  diff: tokenizeDiff(),
  dotenv: tokenizeDotenv(),
  go: tokenizeGo(),
  html: tokenizeHtml(),
  http: tokenizeHttp(),
  ini: tokenizeIni(),
  javascript: tokenizeJavascript(),
  json: tokenizeJson(),
  jsonc: tokenizeJsonc(),
  markdown: tokenizeMarkdown(),
  python: tokenizePython(),
  rust: tokenizeRust(),
  shellsession: tokenizeShellsession(),
  sql: tokenizeSql(),
  svelte: tokenizeSvelte(),
  toml: tokenizeToml(),
  tsx: tokenizeTsx(),
  typescript: tokenizeTypescript(),
  yaml: tokenizeYaml(),
};

const LANGUAGE_ALIASES = CODE_LANGUAGE_ALIASES;

const DEFAULT_LANGUAGE = DEFAULT_CODE_LANGUAGE;

const PALETTES = { dark, light } as const;

type Palette = Record<string, string | undefined>;

const isDarkTheme = (theme: string | null | undefined): boolean =>
  theme?.toLowerCase().includes("dark") ?? false;

const paletteForTheme = (theme: string | null | undefined): Palette =>
  (isDarkTheme(theme) ? PALETTES.dark : PALETTES.light) as Palette;

/**
 * Twinkleplop only emits meaningful tokens — whitespace, indentation and
 * newlines are gaps between triplets. Lexical needs explicit nodes for
 * those, so gap text is re-emitted as plain text / tab / line-break nodes.
 */
const pushGapNodes = (nodes: LexicalNode[], gap: string): void => {
  const lines = gap.split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (lineIndex > 0) {
      nodes.push($createLineBreakNode());
    }
    const parts = (lines[lineIndex] ?? "").split("\t");
    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      if (partIndex > 0) {
        nodes.push($createTabNode());
      }
      const part = parts[partIndex] ?? "";
      if (part !== "") {
        nodes.push($createCodeHighlightNode(part));
      }
    }
  }
};

const pushTokenNodes = (
  nodes: LexicalNode[],
  text: string,
  highlightType: string,
  color: string | undefined
): void => {
  const lines = text.split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (lineIndex > 0) {
      nodes.push($createLineBreakNode());
    }
    const parts = (lines[lineIndex] ?? "").split("\t");
    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      if (partIndex > 0) {
        nodes.push($createTabNode());
      }
      const part = parts[partIndex] ?? "";
      if (part === "") {
        continue;
      }
      const node = $createCodeHighlightNode(part, highlightType);
      if (color) {
        node.setStyle(`color: ${color};`);
      }
      nodes.push(node);
    }
  }
};

/**
 * Drop-in `Tokenizer` for `registerCodeHighlighting` backed by Twinkleplop
 * instead of Shiki. Mirrors the Shiki tokenizer contract: per-node theme
 * drives the light/dark palette, node bg/fg lands on the CodeNode style,
 * and each token becomes a CodeHighlightNode with an inline color.
 */
export const TwinkleplopTokenizer: Tokenizer = {
  $tokenize(codeNode: CodeNode, language?: string): LexicalNode[] {
    const rawLanguage = (language ?? codeNode.getLanguage() ?? DEFAULT_LANGUAGE)
      .trim()
      .toLowerCase();
    const grammarKey = LANGUAGE_ALIASES[rawLanguage] ?? DEFAULT_LANGUAGE;

    const code = codeNode.getTextContent();
    if (code === "") {
      return [];
    }

    const theme = codeNode.getTheme() ?? this.defaultTheme;
    const palette = paletteForTheme(theme);
    const background = palette["background_color"];
    const foreground = palette["identifier"];
    let nodeStyle = "";
    if (background) {
      nodeStyle += `background-color: ${background};`;
    }
    if (foreground) {
      nodeStyle += `color: ${foreground};`;
    }
    if (codeNode.getStyle() !== nodeStyle) {
      codeNode.setStyle(nodeStyle);
    }

    // Plain-text blocks keep uncolored nodes: no grammar pass, just
    // whitespace-aware plain nodes so content is never wiped.
    if (grammarKey === "plaintext") {
      const nodes: LexicalNode[] = [];
      pushGapNodes(nodes, code);
      return nodes;
    }

    const tokenizeFn = TOKENIZERS[grammarKey] ?? TOKENIZERS[DEFAULT_LANGUAGE];
    if (!tokenizeFn) {
      return [];
    }

    let result: ReturnType<TokenizeFn>;
    try {
      result = tokenizeFn(code);
    } catch {
      return [];
    }

    const nodes: LexicalNode[] = [];
    const { token_types, tokens } = result;
    let cursor = 0;
    for (let i = 0; i < tokens.length; i += 3) {
      const typeIndex = tokens[i] as number;
      const start = tokens[i + 1] as number;
      const end = tokens[i + 2] as number;
      if (start > cursor) {
        pushGapNodes(nodes, code.slice(cursor, start));
      }
      const tokenType = token_types[typeIndex] ?? "identifier";
      pushTokenNodes(
        nodes,
        code.slice(start, end),
        tokenType,
        palette[tokenType]
      );
      cursor = end;
    }
    if (cursor < code.length) {
      pushGapNodes(nodes, code.slice(cursor));
    }
    return nodes;
  },
  defaultLanguage: DEFAULT_LANGUAGE,
  defaultTheme: "github-light",
};
