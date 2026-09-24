"use client";

import { $createCodeHighlightNode } from "@lexical/code";
import type { CodeNode } from "@lexical/code";
import type { Tokenizer } from "@lexical/code-shiki";
import { tokenize as tokenizeBash } from "@twinkleplop/bash";
import { tokenize as tokenizeCss } from "@twinkleplop/css";
import { tokenize as tokenizeJavascript } from "@twinkleplop/javascript";
import { tokenize as tokenizeMarkdown } from "@twinkleplop/markdown";
import { dark, light } from "@twinkleplop/theme-github/tokens";
import { tokenize as tokenizeTsx } from "@twinkleplop/tsx";
import { tokenize as tokenizeTypescript } from "@twinkleplop/typescript";
import { $createLineBreakNode, $createTabNode } from "lexical";
import type { LexicalNode } from "lexical";

type TokenizeFn = ReturnType<typeof tokenizeTypescript>;

const TOKENIZERS: Record<string, TokenizeFn> = {
  bash: tokenizeBash(),
  css: tokenizeCss(),
  javascript: tokenizeJavascript(),
  markdown: tokenizeMarkdown(),
  tsx: tokenizeTsx(),
  typescript: tokenizeTypescript(),
};

// Lexical language ids (toolbar, markdown fences, persisted nodes) map onto
// the installed Twinkleplop grammars. JSX has no dedicated package: TSX
// covers it. Unknown ids fall back to the default language like Shiki does.
const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "bash",
  css: "css",
  javascript: "javascript",
  js: "javascript",
  jsx: "tsx",
  markdown: "markdown",
  md: "markdown",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
};

const DEFAULT_LANGUAGE = "javascript";

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
    const tokenizeFn = TOKENIZERS[grammarKey] ?? TOKENIZERS[DEFAULT_LANGUAGE];
    if (!tokenizeFn) {
      return [];
    }

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
