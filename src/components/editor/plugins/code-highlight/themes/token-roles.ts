/**
 * Everforest token-role overrides for the JS/TS grammar family.
 *
 * The Everforest palettes in `everforest.ts` are a verbatim port of the
 * official Shiki `tokenColors`, but Twinkleplop's static grammars assign
 * coarser roles than the reference rendering: `import` and `from` are both
 * `keyword`, an imported component is a bare `identifier`, a declared
 * component is `function`, and JSX brackets collapse into `punctuation`.
 * The reference (VS Code Everforest) renders module keywords
 * (`import`/`export`/`function`) plain, PascalCase values as types,
 * capitalized JSX tags as types, JSX brackets as operators, and JSX props
 * plain — no global palette remap can express that, because e.g. `keyword`
 * must stay red for `from`/`return` while going plain for `import`.
 *
 * `resolveThemedTokenType` is a text-aware, theme-gated role resolver:
 * given the persisted node theme, the normalized grammar key, and the raw
 * token, it returns the token type whose palette entry should style the
 * token. The tokenizer stores the resolved type as the node's highlight
 * type too, so the token audit (`getCodeBlockTokenStyle(theme, type)`)
 * stays self-consistent.
 *
 * Scoped to `everforest-*` + `tsx`/`typescript`/`javascript` only; every
 * other theme or language is the identity function.
 */

const EVERFOREST_FAMILY_PREFIX = "everforest-";

/** Grammar keys (post-alias) these overrides apply to. */
const JS_FAMILY_LANGUAGES = new Set(["tsx", "typescript", "javascript"]);

/**
 * Module-structure keywords the reference renders plain (base text)
 * instead of red. Control-flow keywords (`from`, `return`, `if`, …)
 * keep the red `keyword` entry.
 */
const PLAIN_KEYWORDS = new Set(["import", "export", "function", "default"]);

/** JSX bracket fragments (optionally trailed by `;`, as Twinkleplop merges `/>;`). */
const JSX_BRACKET_PATTERN = /^(?:<\/?|\/?>);?$/u;

/** PascalCase values read as components/types in the reference. */
const PASCAL_CASE_PATTERN = /^[A-Z]/u;

export function resolveThemedTokenType(
  theme: string | null | undefined,
  language: string,
  tokenType: string,
  text: string
): string {
  if (
    typeof theme !== "string" ||
    !theme.startsWith(EVERFOREST_FAMILY_PREFIX) ||
    !JS_FAMILY_LANGUAGES.has(language)
  ) {
    return tokenType;
  }
  if (tokenType === "keyword" && PLAIN_KEYWORDS.has(text)) {
    return "identifier";
  }
  if (
    (tokenType === "identifier" ||
      tokenType === "function" ||
      tokenType === "tag_name") &&
    PASCAL_CASE_PATTERN.test(text)
  ) {
    return "type";
  }
  if (tokenType === "attr_name") {
    return "identifier";
  }
  if (tokenType === "punctuation" && JSX_BRACKET_PATTERN.test(text)) {
    return "operator";
  }
  return tokenType;
}
