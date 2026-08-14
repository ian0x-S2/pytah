import { useEffect, useState } from "react";
import type { HighlighterGeneric, ThemedToken, TokensResult } from "shiki";
import { getSingletonHighlighter, getTokenStyleObject } from "shiki";
import { useTheme } from "@/components/theme-context";
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
let loadedDocsHighlighter: HighlighterGeneric<
  CodeBlockSyntaxLanguage,
  CodeBlockTheme
> | null = null;

const codeTokenCache = new Map<string, TokensResult>();

const EMPTY_CODE_TOKENS_STATE = {
  error: false,
  tokensResult: null,
} as const satisfies {
  error: boolean;
  tokensResult: TokensResult | null;
};

function getDocsHighlighter() {
  if (loadedDocsHighlighter) {
    return Promise.resolve(loadedDocsHighlighter);
  }

  docsHighlighterPromise ??= getSingletonHighlighter({
    langs: [...CODE_BLOCK_LANGUAGES],
    themes: [CODE_BLOCK_THEMES.light, CODE_BLOCK_THEMES.dark],
  }).then((highlighter) => {
    loadedDocsHighlighter = highlighter as HighlighterGeneric<
      CodeBlockSyntaxLanguage,
      CodeBlockTheme
    >;
    return loadedDocsHighlighter;
  });

  return docsHighlighterPromise;
}

function tokenizeSnippetAllThemes(
  highlighter: HighlighterGeneric<CodeBlockSyntaxLanguage, CodeBlockTheme>,
  code: string,
  language: CodeBlockSyntaxLanguage
) {
  for (const t of [CODE_BLOCK_THEMES.light, CODE_BLOCK_THEMES.dark]) {
    const key = getCodeTokenCacheKey(code, language, t);
    if (key && !codeTokenCache.has(key)) {
      try {
        const tokensResult = highlighter.codeToTokens(code, {
          lang: language,
          theme: t,
        });
        codeTokenCache.set(key, tokensResult);
      } catch {
        // ignore errors
      }
    }
  }
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

const getCodeTokenCacheKey = (
  code: string,
  language: CodeBlockSyntaxLanguage | null,
  theme: CodeBlockTheme
) => {
  return language ? `${theme}:${language}:${code}` : null;
};

function useCodeTokens(
  code: string,
  language: CodeBlockSyntaxLanguage | null,
  theme: CodeBlockTheme
) {
  const cacheKey = getCodeTokenCacheKey(code, language, theme);

  if (
    loadedDocsHighlighter &&
    language &&
    cacheKey &&
    !codeTokenCache.has(cacheKey)
  ) {
    tokenizeSnippetAllThemes(loadedDocsHighlighter, code, language);
  }

  const cachedTokens = cacheKey ? (codeTokenCache.get(cacheKey) ?? null) : null;

  const [asyncState, setAsyncState] = useState<{
    cacheKey: string | null;
    error: boolean;
    tokensResult: TokensResult | null;
  }>({
    cacheKey: null,
    error: false,
    tokensResult: null,
  });

  useEffect(() => {
    if (!(language && cacheKey && !cachedTokens)) {
      return;
    }

    let cancelled = false;

    getDocsHighlighter()
      .then((highlighter) => {
        tokenizeSnippetAllThemes(highlighter, code, language);
        if (cancelled) {
          return;
        }

        const tokensResult = codeTokenCache.get(cacheKey) ?? null;
        setAsyncState({ cacheKey, error: false, tokensResult });
      })
      .catch(() => {
        if (!cancelled) {
          setAsyncState({ cacheKey, error: true, tokensResult: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cachedTokens, code, language]);

  if (!cacheKey) {
    return EMPTY_CODE_TOKENS_STATE;
  }

  if (cachedTokens) {
    return { error: false, tokensResult: cachedTokens };
  }

  if (asyncState.cacheKey === cacheKey && asyncState.tokensResult) {
    return {
      error: asyncState.error,
      tokensResult: asyncState.tokensResult,
    };
  }

  return EMPTY_CODE_TOKENS_STATE;
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
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-transparent px-2.5 py-0.5 text-muted-foreground text-xs shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground">
          <span className="size-1.5 rounded-full bg-foreground/80" />
          <span className="font-mono text-[9.5px] uppercase tracking-wider">
            {badge}
          </span>
        </div>
      ) : null}
      <h1 className="font-semibold text-2xl text-foreground leading-tight tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-balance text-muted-foreground text-xs leading-relaxed sm:text-[13.5px]">
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
      className="mt-8 mb-3 font-semibold text-foreground text-lg tracking-tight first:mt-0 sm:mt-10 sm:text-xl"
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
      className="mt-6 mb-2 font-semibold text-[14px] text-foreground tracking-tight sm:text-[15px]"
      id={id}
    >
      {children}
    </h3>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3.5 text-[13px] text-foreground/80 leading-relaxed sm:text-[13.5px] [&_code]:rounded [&_code]:border [&_code]:border-border/60 [&_code]:bg-muted/40 [&_code]:px-1.5 [&_code]:py-0.2 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
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
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border/50 bg-muted/15 shadow-xs transition-colors hover:border-border/80">
      {resolvedLabel ? (
        <div className="flex items-center justify-between border-border/40 border-b bg-muted/30 px-3.5 py-2">
          <span className="truncate font-mono text-[10.5px] text-muted-foreground">
            {resolvedLabel}
          </span>
          {syntaxLanguage ? (
            <span className="font-mono text-[9.5px] text-muted-foreground/60 uppercase">
              {syntaxLanguage}
            </span>
          ) : null}
        </div>
      ) : null}

      {shouldRenderPlainText ? (
        <pre className="overflow-x-auto p-3.5 font-mono text-[11.5px] leading-relaxed sm:p-4 sm:text-xs">
          <code>{children}</code>
        </pre>
      ) : (
        <pre
          className="overflow-x-auto p-3.5 font-mono text-[11.5px] leading-relaxed sm:p-4 sm:text-xs"
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
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50 bg-transparent shadow-xs">
      <table className="w-full text-left text-[12px] sm:text-[13px]">
        <thead>
          <tr className="border-border/50 border-b bg-muted/25 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
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
    <td className="px-3.5 py-2.5 text-foreground/80 leading-relaxed sm:px-4 sm:py-3">
      {children}
    </td>
  );
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
    info: "border-border/60 bg-muted/10",
    tip: "border-foreground/20 bg-muted/15",
    warning: "border-destructive/30 bg-destructive/5",
  };

  const tagStyles = {
    info: "text-muted-foreground",
    tip: "text-foreground",
    warning: "text-destructive",
  };

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
              "font-semibold text-xs tracking-tight",
              tagStyles[variant]
            )}
          >
            {title}
          </p>
        </div>
      ) : null}
      <div className="text-foreground/80 text-xs leading-relaxed sm:text-[12.5px]">
        {children}
      </div>
    </div>
  );
}

export function FileTree({ items }: { items: string[] }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50 bg-muted/15 p-4 font-mono text-[11.5px] leading-relaxed sm:text-xs">
      {items.map((item) => (
        <div className="py-0.5 text-foreground/85" key={item}>
          {item}
        </div>
      ))}
    </div>
  );
}
