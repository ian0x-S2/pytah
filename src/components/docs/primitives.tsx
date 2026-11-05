import { useContext, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import {
  isCodeLanguageLoaded,
  isCodeThemeLoaded,
  loadCodeLanguage,
  loadCodeThemeFamily,
  tokenizeCodeLines,
} from "@/components/editor/plugins/code-highlight/shiki-tokenizer";
import type { ShikiTokenSegment } from "@/components/editor/plugins/code-highlight/shiki-tokenizer";
import { resolveCodeBlockThemeId } from "@/components/editor/plugins/code-highlight/themes/registry";
import type { CodeBlockThemeId } from "@/components/editor/plugins/code-highlight/themes/registry";
import { ThemeContext } from "@/components/theme-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// JSX has no dedicated package: TSX covers it.
const CODE_BLOCK_LANGUAGES = [
  "bash",
  "css",
  "diff",
  "dotenv",
  "go",
  "html",
  "http",
  "ini",
  "javascript",
  "json",
  "jsonc",
  "markdown",
  "python",
  "rust",
  "shellsession",
  "sql",
  "svelte",
  "toml",
  "tsx",
  "typescript",
  "yaml",
] as const;

type CodeBlockSyntaxLanguage = (typeof CODE_BLOCK_LANGUAGES)[number];

const codeTokenCache = new Map<string, ShikiTokenSegment[][]>();

const getCodeTokenCacheKey = (
  code: string,
  language: CodeBlockSyntaxLanguage | null,
  themeId: CodeBlockThemeId
) => (language ? `${themeId}:${language}:${code}` : null);

function getCachedTokenLines(
  code: string,
  language: CodeBlockSyntaxLanguage,
  themeId: CodeBlockThemeId
): ShikiTokenSegment[][] | null {
  const key = getCodeTokenCacheKey(code, language, themeId);
  if (!key) {
    return null;
  }
  const cached = codeTokenCache.get(key);
  if (cached) {
    return cached;
  }
  const lines = tokenizeCodeLines(code, language, themeId);
  if (lines) {
    codeTokenCache.set(key, lines);
  }
  return lines;
}

function parseTokenStyle(style: string): CSSProperties | undefined {
  if (!style) {
    return undefined;
  }
  const css: CSSProperties = {};
  for (const declaration of style.split(";")) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }
    const prop = declaration.slice(0, colonIndex).trim();
    const value = declaration.slice(colonIndex + 1).trim();
    if (!prop || !value) {
      continue;
    }
    if (prop === "color") {
      css.color = value;
    } else if (prop === "background-color") {
      css.backgroundColor = value;
    } else if (prop === "font-style") {
      css.fontStyle = value;
    } else if (prop === "font-weight") {
      css.fontWeight = value;
    } else if (prop === "text-decoration") {
      css.textDecoration = value;
    }
  }
  return css;
}

const CODE_LANGUAGE_ALIASES = {
  bash: "bash",
  console: "shellsession",
  css: "css",
  diff: "diff",
  dotenv: "dotenv",
  env: "dotenv",
  go: "go",
  golang: "go",
  html: "html",
  http: "http",
  ini: "ini",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsonc: "jsonc",
  jsx: "tsx",
  markdown: "markdown",
  md: "markdown",
  plain: "text",
  py: "python",
  python: "python",
  rest: "http",
  rs: "rust",
  rust: "rust",
  sh: "bash",
  shell: "bash",
  shellsession: "shellsession",
  sql: "sql",
  svelte: "svelte",
  terminal: "shellsession",
  text: "text",
  toml: "toml",
  ts: "typescript",
  tsx: "tsx",
  txt: "text",
  typescript: "typescript",
  xml: "html",
  yaml: "yaml",
  yml: "yaml",
} as const satisfies Record<string, CodeBlockSyntaxLanguage | "text">;

type CodeLanguage =
  (typeof CODE_LANGUAGE_ALIASES)[keyof typeof CODE_LANGUAGE_ALIASES];

function useCodeTokenLines(
  code: string,
  language: CodeBlockSyntaxLanguage | null,
  themeId: CodeBlockThemeId
): ShikiTokenSegment[][] | null {
  const [, setLoadTick] = useState(0);
  const isReady = Boolean(
    language && isCodeThemeLoaded(themeId) && isCodeLanguageLoaded(language)
  );

  useEffect(() => {
    if (!language || isReady) {
      return;
    }
    let cancelled = false;
    const loadAssets = async () => {
      try {
        await Promise.all([
          loadCodeThemeFamily(themeId),
          loadCodeLanguage(language),
        ]);
        if (!cancelled) {
          setLoadTick((tick) => tick + 1);
        }
      } catch {
        // Ignore load errors and keep fallback plain text.
      }
    };
    void loadAssets();
    return () => {
      cancelled = true;
    };
  }, [isReady, language, themeId]);

  return useMemo(() => {
    if (!language || !isReady) {
      return null;
    }
    try {
      return getCachedTokenLines(code, language, themeId);
    } catch {
      return null;
    }
  }, [code, isReady, language, themeId]);
}

function normalizeCodeLanguage(language?: string): CodeLanguage | null {
  if (!language) {
    return null;
  }

  return (
    CODE_LANGUAGE_ALIASES[
      language.trim().toLowerCase() as keyof typeof CODE_LANGUAGE_ALIASES
    ] ?? null
  );
}

function inferCodeLanguageFromLabel(label?: string): CodeLanguage | null {
  if (!label) {
    return null;
  }

  const extension = label.split(".").at(-1)?.toLowerCase();

  if (!extension) {
    return null;
  }

  return normalizeCodeLanguage(extension);
}

function resolveCodeBlockMeta(language?: string, label?: string) {
  const normalizedLanguage = normalizeCodeLanguage(language);

  if (normalizedLanguage) {
    return {
      label: label ?? language,
      syntaxLanguage: normalizedLanguage,
    };
  }

  if (!label && language) {
    return {
      label: language,
      syntaxLanguage: inferCodeLanguageFromLabel(language),
    };
  }

  return {
    label,
    syntaxLanguage: inferCodeLanguageFromLabel(label),
  };
}

export function PageHeader({
  children,
  className,
  description,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <div className={cn("mb-9 space-y-2.5", className)}>
      <h1 className="min-w-0 text-2xl leading-tight font-semibold tracking-tight wrap-anywhere text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-xs leading-relaxed text-balance text-muted-foreground sm:text-sm">
        {description}
      </p>
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      className="mt-8 mb-3 text-lg font-semibold tracking-tight text-foreground first:mt-0 sm:mt-10 sm:text-xl"
      id={id}
    >
      {children}
    </h2>
  );
}

export function SubHeading({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h3
      className="mt-6 mb-2 text-sm font-semibold tracking-tight text-foreground sm:text-sm"
      id={id}
    >
      {children}
    </h3>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3.5 text-xs leading-relaxed text-foreground/80 sm:text-sm [&_code]:rounded-sm [&_code]:border [&_code]:border-border/60 [&_code]:bg-muted/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
      {children}
    </p>
  );
}

// When the fence carries no filename the label IS the language
// ("bash" + "BASH"): the header renders it once, in its original case.
function isRedundantCodeLabel(
  label: string | undefined,
  language: CodeLanguage | null
): boolean {
  if (label === undefined || language === null) {
    return false;
  }
  return label.toLowerCase() === language.toLowerCase();
}

function toPlainTokenLines(code: string): ShikiTokenSegment[][] {
  return code
    .split("\n")
    .map((line) => (line === "" ? [] : [{ style: "", text: line }]));
}

function resolveLineNumberState(
  lineNumbers: boolean | { start?: number } | undefined,
  lineCount: number,
  shouldRenderPlainText: boolean
): {
  lineNumberStart: number;
  lineNumberWidth: string;
  showLineNumbers: boolean;
} {
  const lineNumberStart =
    typeof lineNumbers === "object" ? (lineNumbers.start ?? 1) : 1;
  const showLineNumbers =
    !shouldRenderPlainText &&
    (lineNumbers === undefined ? lineCount > 1 : lineNumbers !== false);
  const lastLineNumber = lineNumberStart + Math.max(lineCount, 1) - 1;
  const lineNumberWidth = `${String(Math.max(lastLineNumber, 1)).length}ch`;
  return { lineNumberStart, lineNumberWidth, showLineNumbers };
}

export function CodeBlock({
  children,
  language,
  label,
  lineNumbers,
}: {
  children: string;
  language?: string;
  label?: string;
  /**
   * Line numbers: `true` numbers from 1, `{ start }` numbers from `start`,
   * `false` disables. Defaults to on for multiline highlighted blocks.
   * Plain-text blocks never render numbers.
   */
  lineNumbers?: boolean | { start?: number };
}) {
  const themeContext = useContext(ThemeContext);
  const resolvedTheme = themeContext?.resolvedTheme ?? "light";
  const themeId = resolveCodeBlockThemeId("github", resolvedTheme);
  const { label: resolvedLabel, syntaxLanguage } = resolveCodeBlockMeta(
    language,
    label
  );
  const activeLanguage =
    syntaxLanguage && syntaxLanguage !== "text" ? syntaxLanguage : null;
  const tokenLines = useCodeTokenLines(children, activeLanguage, themeId);
  const displayLines =
    tokenLines ?? (activeLanguage ? toPlainTokenLines(children) : null);
  const shouldRenderPlainText = !activeLanguage || !displayLines;
  const { lineNumberStart, lineNumberWidth, showLineNumbers } =
    resolveLineNumberState(
      lineNumbers,
      displayLines?.length ?? 0,
      shouldRenderPlainText
    );
  const isRedundantLabel = isRedundantCodeLabel(resolvedLabel, syntaxLanguage);

  return (
    <div className="group relative my-4 overflow-hidden rounded-sm border border-border/50 bg-muted/15 shadow-xs transition-colors hover:border-border/80">
      {resolvedLabel ? (
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3.5 py-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {resolvedLabel}
          </span>
          {!isRedundantLabel && syntaxLanguage ? (
            <span className="font-mono text-xs text-muted-foreground/60">
              {syntaxLanguage}
            </span>
          ) : null}
        </div>
      ) : null}

      {shouldRenderPlainText || !displayLines ? (
        <pre className="scrollbar-hidden overflow-x-auto p-3.5 font-mono text-xs leading-relaxed sm:p-4 sm:text-xs">
          <code>{children}</code>
        </pre>
      ) : (
        <pre className="m-0 scrollbar-hidden overflow-x-auto bg-transparent p-3.5 font-mono text-xs leading-relaxed sm:p-4 sm:text-xs">
          <code>
            {displayLines.map((line, lineIndex) => {
              const lineText = line.map((token) => token.text).join("");
              const lineKey = `${lineIndex}:${lineText}`;

              return (
                <span className="block" key={lineKey}>
                  {showLineNumbers ? (
                    <span
                      aria-hidden="true"
                      className="mr-3 inline-block w-8 text-right text-muted-foreground select-none"
                      style={{ width: lineNumberWidth }}
                    >
                      {lineNumberStart + lineIndex}
                    </span>
                  ) : null}
                  {line.length > 0
                    ? line.map((token, tokenIndex) => {
                        const tokenKey = `${lineKey}:${tokenIndex}:${token.text}`;
                        const tokenStyle = parseTokenStyle(token.style);

                        return tokenStyle ? (
                          <span key={tokenKey} style={tokenStyle}>
                            {token.text}
                          </span>
                        ) : (
                          <span key={tokenKey}>{token.text}</span>
                        );
                      })
                    : " "}
                </span>
              );
            })}
          </code>
        </pre>
      )}
    </div>
  );
}

export function Table({
  children,
  headers,
}: {
  children: React.ReactNode;
  headers: string[];
}) {
  return (
    <div className="my-4 overflow-hidden rounded-sm border border-border/50 bg-transparent shadow-xs">
      <ScrollArea>
        <table className="w-full text-left text-xs sm:text-xs">
          <thead>
            <tr className="border-b border-border/50 bg-muted/25 font-mono text-xs tracking-wider text-muted-foreground">
              {headers.map((header) => (
                <th className="px-3.5 py-2.5 font-medium sm:px-4" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">{children}</tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="transition-colors hover:bg-muted/15">{children}</tr>;
}

export function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3.5 py-2.5 leading-relaxed text-foreground/80 sm:px-4 sm:py-3">
      {children}
    </td>
  );
}

const ruleStyles = {
  info: "border-border/70",
  tip: "border-foreground/30",
  warning: "border-destructive/40",
};

const titleStyles = {
  info: "text-muted-foreground",
  tip: "text-foreground",
  warning: "text-destructive",
};

export function Callout({
  children,
  title,
  variant = "info",
}: {
  children: React.ReactNode;
  title?: string;
  variant?: "info" | "warning" | "tip";
}) {
  return (
    <div className={cn("my-4 border-l-2 pl-4 text-left", ruleStyles[variant])}>
      {title ? (
        <p
          className={cn(
            "mb-1 text-xs font-semibold tracking-tight",
            titleStyles[variant]
          )}
        >
          {title}
        </p>
      ) : null}
      <div className="text-xs leading-relaxed text-foreground/80 sm:text-sm">
        {children}
      </div>
    </div>
  );
}

export function FileTree({ items }: { items: string[] }) {
  return (
    <div className="my-4 overflow-hidden rounded-sm border border-border/50 bg-muted/15">
      <ScrollArea>
        <div className="p-4 font-mono text-xs leading-relaxed sm:text-xs">
          {items.map((item) => (
            <div className="py-0.5 text-foreground/85" key={item}>
              {item}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
