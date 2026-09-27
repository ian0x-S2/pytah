"use client";

import type { theme_palette, theme_styles } from "@twinkleplop/core";
import {
  dark as catppuccinDark,
  dark_styles as catppuccinDarkStyles,
  light as catppuccinLight,
  light_styles as catppuccinLightStyles,
} from "@twinkleplop/theme-catppuccin/tokens";
import {
  dark as githubDark,
  dark_styles as githubDarkStyles,
  light as githubLight,
  light_styles as githubLightStyles,
} from "@twinkleplop/theme-github/tokens";

import {
  dark as everforestDark,
  dark_styles as everforestDarkStyles,
  light as everforestLight,
  light_styles as everforestLightStyles,
} from "./everforest";
import {
  dark as nordDark,
  dark_styles as nordDarkStyles,
  light as nordLight,
  light_styles as nordLightStyles,
} from "./nord";

/**
 * Code-block theme families. Most families ship a light and a dark
 * palette and the active variant follows the app theme (`resolvedTheme`),
 * so one picker value covers both modes. Nord is the exception: the
 * reference ships dark-only, so the family is pinned to its dark variant
 * in both modes (see `resolveCodeBlockThemeId`).
 *
 * `github` and `catppuccin` are upstream Twinkleplop packages;
 * `nord` and `everforest` are local themes authored in this folder
 * (see `nord.ts` / `everforest.ts`).
 */
export const CODE_BLOCK_THEME_FAMILIES = [
  { label: "GitHub", value: "github" },
  { label: "Catppuccin", value: "catppuccin" },
  { label: "Nord", value: "nord" },
  { label: "Everforest", value: "everforest" },
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
  // The Nord reference ships dark-only: keep the dark Polar Night block
  // (bg + verbatim token hues) even when the app runs in light mode.
  nord: "dark",
};

const PALETTES: Record<CodeBlockThemeId, theme_palette> = {
  "catppuccin-dark": catppuccinDark,
  "catppuccin-light": catppuccinLight,
  "everforest-dark": everforestDark,
  "everforest-light": everforestLight,
  "github-dark": githubDark,
  "github-light": githubLight,
  "nord-dark": nordDark,
  "nord-light": nordLight,
};

const STYLES: Record<CodeBlockThemeId, theme_styles> = {
  "catppuccin-dark": catppuccinDarkStyles,
  "catppuccin-light": catppuccinLightStyles,
  "everforest-dark": everforestDarkStyles,
  "everforest-light": everforestLightStyles,
  "github-dark": githubDarkStyles,
  "github-light": githubLightStyles,
  "nord-dark": nordDarkStyles,
  "nord-light": nordLightStyles,
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

const FALLBACK_THEME_ID: CodeBlockThemeId = "github-light";

/** Palette for a persisted node theme; unknown ids fall back to GitHub light. */
export function getCodeBlockPalette(
  theme: string | null | undefined
): theme_palette {
  if (theme !== null && theme !== undefined) {
    const palette = (PALETTES as Record<string, theme_palette | undefined>)[
      theme
    ];
    if (palette) {
      return palette;
    }
  }
  return PALETTES[FALLBACK_THEME_ID] ?? githubLight;
}

/** Font-style map (`italic`/`bold`/…) for a persisted node theme. */
export function getCodeBlockStyles(
  theme: string | null | undefined
): theme_styles {
  if (theme !== null && theme !== undefined) {
    const styles = (STYLES as Record<string, theme_styles | undefined>)[theme];
    if (styles) {
      return styles;
    }
  }
  return STYLES[FALLBACK_THEME_ID] ?? githubLightStyles;
}

const FONT_STYLE_DECLARATIONS: Record<string, string> = {
  bold: "font-weight: bold;",
  italic: "font-style: italic;",
  strikethrough: "text-decoration: line-through;",
  underline: "text-decoration: underline;",
};

/**
 * Inline style for one token: its palette color plus any font styles
 * (italic comments, bold headings, …) the theme declares for the type.
 */
export function getCodeBlockTokenStyle(
  theme: string | null | undefined,
  tokenType: string
): string {
  const palette = getCodeBlockPalette(theme);
  const styles = getCodeBlockStyles(theme);
  let style = "";
  const color = palette[tokenType];
  if (color) {
    style += `color: ${color};`;
  }
  const tokenStyles = styles[tokenType];
  if (tokenStyles) {
    for (const tokenStyle of tokenStyles) {
      style += FONT_STYLE_DECLARATIONS[tokenStyle] ?? "";
    }
  }
  return style;
}
