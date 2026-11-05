"use client";

import type { ThemeRegistration } from "shiki/core";

/**
 * Pre-selected code-block theme families backed by fine-grained
 * `@shikijs/themes/*` imports.
 *
 * Dual-variant families (`github`, `catppuccin`, `everforest`) switch
 * between their light and dark Shiki themes alongside the app's
 * `resolvedTheme`. Single-variant families (`nord`, `tokyo-night`) ship
 * dark-only in `@shikijs/themes` and stay pinned to dark in both app modes.
 */
export const CODE_BLOCK_THEME_FAMILIES = [
  { label: "GitHub", value: "github" },
  { label: "Catppuccin", value: "catppuccin" },
  { label: "Nord", value: "nord" },
  { label: "Everforest", value: "everforest" },
  { label: "Tokyo Night", value: "tokyo-night" },
] as const;

export type CodeBlockThemeFamily =
  (typeof CODE_BLOCK_THEME_FAMILIES)[number]["value"];

export type CodeBlockThemeMode = "light" | "dark";

/** Fully-resolved per-node theme id persisted on the Lexical `CodeNode`. */
export type CodeBlockThemeId = `${CodeBlockThemeFamily}-${CodeBlockThemeMode}`;

export const DEFAULT_CODE_BLOCK_THEME_FAMILY: CodeBlockThemeFamily = "nord";

/** Families pinned to a single variant in every app mode. */
const SINGLE_VARIANT_FAMILIES: Partial<
  Record<CodeBlockThemeFamily, CodeBlockThemeMode>
> = {
  nord: "dark",
  "tokyo-night": "dark",
};

export interface CodeBlockThemeMeta {
  background: string;
  foreground: string;
  gutter: string;
}

/**
 * Static block chrome metadata extracted from each `@shikijs/themes/*`
 * definition (`colors["editor.background"]`, `colors["editor.foreground"]`,
 * `colors["editorLineNumber.foreground"]`). Kept inline so `--editor-code-bg`,
 * `--editor-code-fg`, and the line-number gutter paint synchronously on
 * frame 0 before any async theme chunk resolves.
 */
const THEME_META: Record<CodeBlockThemeId, CodeBlockThemeMeta> = {
  "catppuccin-dark": {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    gutter: "#7f849c",
  },
  "catppuccin-light": {
    background: "#eff1f5",
    foreground: "#4c4f69",
    gutter: "#8c8fa1",
  },
  "everforest-dark": {
    background: "#2d353b",
    foreground: "#d3c6aa",
    gutter: "#7f897da0",
  },
  "everforest-light": {
    background: "#fdf6e3",
    foreground: "#5c6a72",
    gutter: "#a4ad9ea0",
  },
  "github-dark": {
    background: "#24292e",
    foreground: "#e1e4e8",
    gutter: "#444d56",
  },
  "github-light": {
    background: "#fff",
    foreground: "#24292e",
    gutter: "#1b1f234d",
  },
  "nord-dark": {
    background: "#2e3440",
    foreground: "#d8dee9",
    gutter: "#4c566a",
  },
  "nord-light": {
    background: "#2e3440",
    foreground: "#d8dee9",
    gutter: "#4c566a",
  },
  "tokyo-night-dark": {
    background: "#1a1b26",
    foreground: "#a9b1d6",
    gutter: "#363b54",
  },
  "tokyo-night-light": {
    background: "#1a1b26",
    foreground: "#a9b1d6",
    gutter: "#363b54",
  },
};

export interface ShikiThemeModule {
  default: ThemeRegistration;
}

/**
 * Fine-grained dynamic imports for the pre-selected Shiki themes only.
 * Bundlers split each entry into a dedicated on-demand chunk without pulling
 * the remaining 55+ themes from `@shikijs/themes`.
 */
export const SHIKI_THEME_LOADERS: Record<
  CodeBlockThemeId,
  () => Promise<ShikiThemeModule>
> = {
  "catppuccin-dark": () => import("@shikijs/themes/catppuccin-mocha"),
  "catppuccin-light": () => import("@shikijs/themes/catppuccin-latte"),
  "everforest-dark": () => import("@shikijs/themes/everforest-dark"),
  "everforest-light": () => import("@shikijs/themes/everforest-light"),
  "github-dark": () => import("@shikijs/themes/github-dark"),
  "github-light": () => import("@shikijs/themes/github-light"),
  "nord-dark": () => import("@shikijs/themes/nord"),
  "nord-light": () => import("@shikijs/themes/nord"),
  "tokyo-night-dark": () => import("@shikijs/themes/tokyo-night"),
  "tokyo-night-light": () => import("@shikijs/themes/tokyo-night"),
};

export function isCodeBlockThemeFamily(
  value: unknown
): value is CodeBlockThemeFamily {
  return CODE_BLOCK_THEME_FAMILIES.some((family) => family.value === value);
}

export function resolveCodeBlockThemeId(
  family: CodeBlockThemeFamily,
  mode: CodeBlockThemeMode
): CodeBlockThemeId {
  const pinned = SINGLE_VARIANT_FAMILIES[family];
  return `${family}-${pinned ?? mode}`;
}

export const FALLBACK_CODE_BLOCK_THEME_ID: CodeBlockThemeId = "nord-dark";

export function isCodeBlockThemeId(value: unknown): value is CodeBlockThemeId {
  return typeof value === "string" && value in THEME_META;
}

export function normalizeCodeBlockThemeId(
  theme: string | null | undefined
): CodeBlockThemeId {
  if (isCodeBlockThemeId(theme)) {
    const family = theme.replace(/-(?:light|dark)$/u, "");
    if (isCodeBlockThemeFamily(family)) {
      const pinned = SINGLE_VARIANT_FAMILIES[family];
      if (pinned) {
        return `${family}-${pinned}`;
      }
    }
    return theme;
  }
  return FALLBACK_CODE_BLOCK_THEME_ID;
}

/**
 * Returns the resolved theme ids belonging to the same family as `themeId`.
 * Dual-variant families return both light and dark ids so preloading a
 * family warms its sibling mode for instant `.dark` toggles.
 */
export function getFamilyCodeBlockThemeIds(
  theme: string | null | undefined
): readonly CodeBlockThemeId[] {
  const resolved = normalizeCodeBlockThemeId(theme);
  const family = resolved.replace(
    /-(?:light|dark)$/u,
    ""
  ) as CodeBlockThemeFamily;
  const pinned = SINGLE_VARIANT_FAMILIES[family];
  if (pinned) {
    return [`${family}-${pinned}`];
  }
  return [`${family}-light`, `${family}-dark`];
}

/**
 * Block background overrides per resolved theme id.
 *
 * GitHub renders on the shadcn card surface instead of its upstream
 * `#ffffff` / `#24292e` so code blocks sit on `--card` like the rest of
 * the chrome. Every other family keeps its theme `editor.background`.
 * Fallbacks mirror `src/index.css` (`:root` / `.dark` `--card`).
 */
const CODE_BLOCK_BACKGROUND_OVERRIDES: Partial<
  Record<CodeBlockThemeId, string>
> = {
  "github-dark": "var(--card, oklch(0.205 0 0))",
  "github-light": "var(--card, oklch(1 0 0))",
};

export function getCodeBlockThemeMeta(
  theme: string | null | undefined
): CodeBlockThemeMeta {
  if (isCodeBlockThemeId(theme)) {
    return THEME_META[theme];
  }
  return THEME_META[FALLBACK_CODE_BLOCK_THEME_ID];
}

/**
 * Block background for a persisted node theme: override first, theme
 * `background` otherwise. Used both for `--editor-code-bg` and the
 * `CodeNode` inline style so the two never diverge.
 */
export function getCodeBlockBackground(
  theme: string | null | undefined
): string {
  if (isCodeBlockThemeId(theme)) {
    const override = CODE_BLOCK_BACKGROUND_OVERRIDES[theme];
    if (override) {
      return override;
    }
    return THEME_META[theme].background;
  }
  return (
    CODE_BLOCK_BACKGROUND_OVERRIDES[FALLBACK_CODE_BLOCK_THEME_ID] ??
    THEME_META[FALLBACK_CODE_BLOCK_THEME_ID].background
  );
}

/** Base foreground color for a persisted node theme. */
export function getCodeBlockForeground(
  theme: string | null | undefined
): string {
  return getCodeBlockThemeMeta(theme).foreground;
}

/** Line-number gutter foreground color (`editorLineNumber.foreground`). */
export function getCodeBlockGutterColor(
  theme: string | null | undefined
): string {
  return getCodeBlockThemeMeta(theme).gutter;
}
