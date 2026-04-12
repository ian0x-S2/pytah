import { useEffect, useState } from "react";
import type { HighlighterGeneric, ThemedToken, TokensResult } from "shiki";
import { getSingletonHighlighter, getTokenStyleObject } from "shiki";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const CODE_BLOCK_THEMES = {
  dark: "github-dark",
  light: "github-light",
} as const;

const CODE_BLOCK_LANGUAGES = [
  "bash",
  "css",
  "javascript",
  "jsx",
  "markdown",
  "typescript",
  "tsx",
] as const;

type CodeBlockTheme =
  (typeof CODE_BLOCK_THEMES)[keyof typeof CODE_BLOCK_THEMES];
type CodeBlockSyntaxLanguage = (typeof CODE_BLOCK_LANGUAGES)[number];

let docsHighlighterPromise: Promise<
  HighlighterGeneric<CodeBlockSyntaxLanguage, CodeBlockTheme>
> | null = null;

const codeTokenCache = new Map<string, TokensResult>();

function getDocsHighlighter() {
  docsHighlighterPromise ??= getSingletonHighlighter({
    langs: [...CODE_BLOCK_LANGUAGES],
    themes: [CODE_BLOCK_THEMES.light, CODE_BLOCK_THEMES.dark],
  }) as Promise<HighlighterGeneric<CodeBlockSyntaxLanguage, CodeBlockTheme>>;

  return docsHighlighterPromise;
}

const CODE_LANGUAGE_ALIASES = {
  bash: "bash",
  css: "css",
  javascript: "javascript",
  js: "javascript",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  plain: "text",
  sh: "bash",
  shell: "bash",
  text: "text",
  ts: "typescript",
  tsx: "tsx",
  txt: "text",
  typescript: "typescript",
} as const satisfies Record<string, CodeBlockSyntaxLanguage | "text">;

type CodeLanguage =
  (typeof CODE_LANGUAGE_ALIASES)[keyof typeof CODE_LANGUAGE_ALIASES];

function useCodeTokens(
  code: string,
  language: CodeBlockSyntaxLanguage | null,
  theme: CodeBlockTheme
) {
  const [state, setState] = useState<{
    error: boolean;
    tokensResult: TokensResult | null;
  }>({
    error: false,
    tokensResult: null,
  });

  useEffect(() => {
    if (!language) {
      setState({ error: false, tokensResult: null });
      return;
    }

    const cacheKey = `${theme}:${language}:${code}`;
    const cachedTokens = codeTokenCache.get(cacheKey);

    if (cachedTokens) {
      setState({ error: false, tokensResult: cachedTokens });
      return;
    }

    let cancelled = false;

    getDocsHighlighter()
      .then((highlighter) =>
        highlighter.codeToTokens(code, {
          lang: language,
          theme,
        })
      )
      .then((tokensResult) => {
        if (cancelled) {
          return;
        }

        codeTokenCache.set(cacheKey, tokensResult);
        setState({ error: false, tokensResult });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ error: true, tokensResult: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);

  return state;
}

function tokenStyleToReactStyle(token: ThemedToken) {
  return getTokenStyleObject(token);
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

interface SourceSliceOptions {
  end: string;
  includeEnd?: boolean;
  start: string;
}

export function sliceSource(
  source: string,
  { end, includeEnd = true, start }: SourceSliceOptions
) {
  const startIndex = source.indexOf(start);

  if (startIndex < 0) {
    throw new Error(`Source slice start marker was not found: ${start}`);
  }

  const endMarkerIndex = source.indexOf(end, startIndex);

  if (endMarkerIndex < 0) {
    throw new Error(`Source slice end marker was not found: ${end}`);
  }

  const endIndex = includeEnd ? endMarkerIndex + end.length : endMarkerIndex;

  return source.slice(startIndex, endIndex).trim();
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
    <div className={cn("mb-10 space-y-2", className)}>
      {badge ? (
        <div className="inline-flex rounded border border-border/60 px-2 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
          {badge}
        </div>
      ) : null}
      <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
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
      className="mt-6 mb-4 font-semibold text-2xl text-foreground tracking-tight first:mt-0 sm:mt-10"
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
      className="mt-6 mb-3 font-semibold text-foreground text-lg tracking-tight"
      id={id}
    >
      {children}
    </h3>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-foreground/90 leading-7 [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]">
      {children}
    </p>
  );
}

export function CodeBlock({
  children,
  language,
  label,
}: {
  children: string;
  language?: string;
  label?: string;
}) {
  const { resolvedTheme } = useTheme();
  const codeBlockTheme = CODE_BLOCK_THEMES[resolvedTheme];
  const { label: resolvedLabel, syntaxLanguage } = resolveCodeBlockMeta(
    language,
    label
  );
  const shouldHighlight = syntaxLanguage && syntaxLanguage !== "text";
  const { error, tokensResult } = useCodeTokens(
    children,
    shouldHighlight ? syntaxLanguage : null,
    codeBlockTheme
  );
  const highlightedTokens = tokensResult?.tokens ?? null;
  const shouldRenderPlainText = !shouldHighlight || error || !highlightedTokens;
  const codeForegroundColor = tokensResult?.fg;

  return (
    <div className="group relative my-4">
      {resolvedLabel ? (
        <div className="overflow-x-hidden rounded-t-lg border border-border border-b-0 bg-muted/50 px-4 py-2">
          <span className="truncate font-mono text-muted-foreground text-xs">
            {resolvedLabel}
          </span>
        </div>
      ) : null}

      {shouldRenderPlainText ? (
        <pre
          className={cn(
            "overflow-x-auto border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed",
            resolvedLabel ? "rounded-b-lg border border-border" : "rounded-lg"
          )}
        >
          <code>{children}</code>
        </pre>
      ) : (
        <pre
          className={cn(
            "overflow-x-auto border border-border bg-muted/50 p-4 font-mono text-sm leading-relaxed",
            resolvedLabel ? "rounded-b-lg border-t-0" : "rounded-lg"
          )}
          style={{
            backgroundColor: "transparent",
            color: codeForegroundColor ?? undefined,
            margin: 0,
          }}
        >
          <code>
            {highlightedTokens.map((line, lineIndex) => {
              const lineText = line.map((token) => token.content).join("");
              const lineKey = `${lineIndex}:${lineText}`;

              return (
                <span className="block" key={lineKey}>
                  {line.length > 0
                    ? line.map((token, tokenIndex) => {
                        const tokenKey = `${lineKey}:${tokenIndex}:${token.content}`;

                        return (
                          <span
                            key={tokenKey}
                            style={tokenStyleToReactStyle(token)}
                          >
                            {token.content}
                          </span>
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
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b bg-muted/50">
            {headers.map((header) => (
              <th
                className="px-4 py-2.5 text-left font-medium text-foreground"
                key={header}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-border border-b last:border-0">{children}</tr>;
}

export function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-foreground/90">{children}</td>;
}

export function Callout({
  children,
  title,
  variant = "info",
}: {
  children: React.ReactNode;
  title?: string;
  variant?: "info" | "warning" | "tip";
}) {
  const styles = {
    info: "border-primary/30 bg-primary/5",
    tip: "border-accent-foreground/30 bg-accent/50",
    warning: "border-destructive/30 bg-destructive/5",
  };

  return (
    <div className={cn("my-4 rounded-lg border p-4", styles[variant])}>
      {title ? (
        <p className="mb-1 font-medium text-foreground text-sm">{title}</p>
      ) : null}
      <div className="text-foreground/80 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function FileTree({ items }: { items: string[] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm">
      {items.map((item) => (
        <div className="py-0.5 text-foreground/80" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}
