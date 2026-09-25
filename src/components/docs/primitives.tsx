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
import "@twinkleplop/theme-github";
import { tokenize as tokenizeToml } from "@twinkleplop/toml";
import { tokenize as tokenizeTsx } from "@twinkleplop/tsx";
import { tokenize as tokenizeTypescript } from "@twinkleplop/typescript";
import { tokenize as tokenizeYaml } from "@twinkleplop/yaml";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

type TokenizeFactory = typeof tokenizeTypescript;
type TokenizerFn = ReturnType<TokenizeFactory>;

const TOKENIZERS: Record<string, TokenizerFn> = {
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

interface TokenSegment {
  text: string;
  type: string | null;
}

const codeTokenCache = new Map<string, TokenSegment[][]>();

const getCodeTokenCacheKey = (
  code: string,
  language: CodeBlockSyntaxLanguage | null
) => (language ? `${language}:${code}` : null);

function tokenizeToLines(
  code: string,
  language: CodeBlockSyntaxLanguage
): TokenSegment[][] | null {
  const tokenizeFn = TOKENIZERS[language];
  if (!tokenizeFn) {
    return null;
  }
  let result: ReturnType<TokenizerFn>;
  try {
    result = tokenizeFn(code);
  } catch {
    return null;
  }
  const lines: TokenSegment[][] = [[]];
  const pushText = (text: string, type: string | null) => {
    const parts = text.split("\n");
    for (let index = 0; index < parts.length; index += 1) {
      if (index > 0) {
        lines.push([]);
      }
      const part = parts[index] ?? "";
      if (part !== "") {
        lines.at(-1)?.push({ text: part, type });
      }
    }
  };
  const { token_types, tokens } = result;
  let cursor = 0;
  for (let i = 0; i < tokens.length; i += 3) {
    const typeIndex = tokens[i] as number;
    const start = tokens[i + 1] as number;
    const end = tokens[i + 2] as number;
    if (start > cursor) {
      pushText(code.slice(cursor, start), null);
    }
    pushText(code.slice(start, end), token_types[typeIndex] ?? null);
    cursor = end;
  }
  if (cursor < code.length) {
    pushText(code.slice(cursor), null);
  }
  return lines;
}

function getCachedTokenLines(
  code: string,
  language: CodeBlockSyntaxLanguage
): TokenSegment[][] | null {
  const key = getCodeTokenCacheKey(code, language);
  if (!key) {
    return null;
  }
  const cached = codeTokenCache.get(key);
  if (cached) {
    return cached;
  }
  const lines = tokenizeToLines(code, language);
  if (lines) {
    codeTokenCache.set(key, lines);
  }
  return lines;
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
  language: CodeBlockSyntaxLanguage | null
) {
  return useMemo(() => {
    if (!language) {
      return null;
    }
    try {
      return getCachedTokenLines(code, language);
    } catch {
      return null;
    }
  }, [code, language]);
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
  badge,
  children,
  className,
  description,
  title,
}: {
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <div className={cn("mb-9 space-y-2.5", className)}>
      {badge ? (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-transparent px-2.5 py-0.5 text-xs text-muted-foreground shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground">
          <span className="size-1.5 rounded-full bg-foreground/80" />
          <span className="font-mono text-xs tracking-wider uppercase">
            {badge}
          </span>
        </div>
      ) : null}
      <h1 className="text-2xl leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
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
    <p className="mb-3.5 text-xs leading-relaxed text-foreground/80 sm:text-sm [&_code]:rounded [&_code]:border [&_code]:border-border/60 [&_code]:bg-muted/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
      {children}
    </p>
  );
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
   * Line numbers (`<span class="ln">`) per the Twinkleplop `line_numbers`
   * render option: `true` numbers from 1, `{ start }` numbers from `start`,
   * `false` disables. Defaults to on for multiline highlighted blocks.
   * Plain-text blocks never render numbers.
   */
  lineNumbers?: boolean | { start?: number };
}) {
  const { label: resolvedLabel, syntaxLanguage } = resolveCodeBlockMeta(
    language,
    label
  );
  const shouldHighlight = syntaxLanguage && syntaxLanguage !== "text";
  const tokenLines = useCodeTokenLines(
    children,
    shouldHighlight ? syntaxLanguage : null
  );
  const shouldRenderPlainText = !shouldHighlight || !tokenLines;
  const lineNumberStart =
    typeof lineNumbers === "object" ? (lineNumbers.start ?? 1) : 1;
  const showLineNumbers =
    !shouldRenderPlainText &&
    (lineNumbers === undefined
      ? (tokenLines?.length ?? 0) > 1
      : lineNumbers !== false);

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border/50 bg-muted/15 shadow-xs transition-colors hover:border-border/80">
      {resolvedLabel ? (
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3.5 py-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {resolvedLabel}
          </span>
          {syntaxLanguage ? (
            <span className="font-mono text-xs text-muted-foreground/60 uppercase">
              {syntaxLanguage}
            </span>
          ) : null}
        </div>
      ) : null}

      {shouldRenderPlainText || !tokenLines ? (
        <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed sm:p-4 sm:text-xs">
          <code>{children}</code>
        </pre>
      ) : (
        <pre className="twinkleplop m-0 overflow-x-auto bg-transparent p-3.5 font-mono text-xs leading-relaxed sm:p-4 sm:text-xs">
          <code>
            {tokenLines.map((line, lineIndex) => {
              const lineText = line.map((token) => token.text).join("");
              const lineKey = `${lineIndex}:${lineText}`;

              return (
                <span className="block" key={lineKey}>
                  {showLineNumbers ? (
                    <span aria-hidden="true" className="ln">
                      {lineNumberStart + lineIndex}
                    </span>
                  ) : null}
                  {line.length > 0
                    ? line.map((token, tokenIndex) => {
                        const tokenKey = `${lineKey}:${tokenIndex}:${token.text}`;

                        return token.type ? (
                          <span className={token.type} key={tokenKey}>
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
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50 bg-transparent shadow-xs">
      <table className="w-full text-left text-xs sm:text-xs">
        <thead>
          <tr className="border-b border-border/50 bg-muted/25 font-mono text-xs tracking-wider text-muted-foreground uppercase">
            {headers.map((header) => (
              <th className="px-3.5 py-2.5 font-medium sm:px-4" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">{children}</tbody>
      </table>
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

const styles = {
  info: "border-border/60 bg-muted/10",
  tip: "border-foreground/20 bg-muted/15",
  warning: "border-destructive/30 bg-destructive/5",
};

const tagStyles = {
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
    <div
      className={cn(
        "my-4 rounded-xl border p-4 text-left transition-all duration-200 sm:p-5",
        styles[variant]
      )}
    >
      {title ? (
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-foreground/60" />
          <p
            className={cn(
              "text-xs font-semibold tracking-tight",
              tagStyles[variant]
            )}
          >
            {title}
          </p>
        </div>
      ) : null}
      <div className="text-xs leading-relaxed text-foreground/80 sm:text-xs">
        {children}
      </div>
    </div>
  );
}

export function FileTree({ items }: { items: string[] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50 bg-muted/15 p-4 font-mono text-xs leading-relaxed sm:text-xs">
      {items.map((item) => (
        <div className="py-0.5 text-foreground/85" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}
