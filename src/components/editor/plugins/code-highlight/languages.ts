"use client";

export interface CodeBlockLanguage {
  label: string;
  value: string;
}

/**
 * Canonical code-block languages backed by an installed Twinkleplop
 * grammar. `value` is what is persisted on the Lexical `CodeNode`
 * (and in markdown fences); `label` is the human-readable dropdown text.
 */
export const CODE_BLOCK_LANGUAGES: readonly CodeBlockLanguage[] = [
  { label: "Bash", value: "bash" },
  { label: "CSS", value: "css" },
  { label: "Diff", value: "diff" },
  { label: "Dotenv", value: "dotenv" },
  { label: "Go", value: "go" },
  { label: "HTML", value: "html" },
  { label: "HTTP", value: "http" },
  { label: "INI", value: "ini" },
  { label: "JavaScript", value: "javascript" },
  { label: "JSON", value: "json" },
  { label: "JSONC", value: "jsonc" },
  { label: "Markdown", value: "markdown" },
  { label: "Plain text", value: "plaintext" },
  { label: "Python", value: "python" },
  { label: "Rust", value: "rust" },
  { label: "Shell session", value: "shellsession" },
  { label: "SQL", value: "sql" },
  { label: "Svelte", value: "svelte" },
  { label: "TOML", value: "toml" },
  { label: "TSX", value: "tsx" },
  { label: "TypeScript", value: "typescript" },
  { label: "YAML", value: "yaml" },
];

/**
 * Lexical language ids (toolbar, markdown fences, persisted nodes) map onto
 * the installed Twinkleplop grammars. JSX has no dedicated package: TSX
 * covers it. Unknown ids fall back to the default language like Shiki does.
 */
export const CODE_LANGUAGE_ALIASES: Record<string, string> = {
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
  plain: "plaintext",
  plaintext: "plaintext",
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
  text: "plaintext",
  toml: "toml",
  ts: "typescript",
  tsx: "tsx",
  txt: "plaintext",
  typescript: "typescript",
  xml: "html",
  yaml: "yaml",
  yml: "yaml",
};

export const DEFAULT_CODE_LANGUAGE = "javascript";

export const CODE_LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  CODE_BLOCK_LANGUAGES.map((language) => [language.value, language.label])
);

export const normalizeCodeLanguageId = (raw?: string | null): string => {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (normalized === "") {
    return DEFAULT_CODE_LANGUAGE;
  }
  return CODE_LANGUAGE_ALIASES[normalized] ?? DEFAULT_CODE_LANGUAGE;
};

export const getCodeLanguageLabel = (value?: string | null): string =>
  CODE_LANGUAGE_LABELS[normalizeCodeLanguageId(value)] ??
  CODE_LANGUAGE_LABELS[DEFAULT_CODE_LANGUAGE] ??
  DEFAULT_CODE_LANGUAGE;
