import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  getShikiHighlighter,
  isCodeLanguageLoaded,
  isCodeThemeLoaded,
  loadCodeLanguage,
  loadCodeTheme,
  loadCodeThemeFamily,
  tokenizeCodeLines,
} from "../shiki-tokenizer";
import {
  CODE_BLOCK_THEME_FAMILIES,
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  getCodeBlockBackground,
  getCodeBlockForeground,
  getCodeBlockGutterColor,
  getFamilyCodeBlockThemeIds,
  isCodeBlockThemeFamily,
  normalizeCodeBlockThemeId,
  resolveCodeBlockThemeId,
  SHIKI_THEME_LOADERS,
} from "./registry";

describe("code-block theme registry", () => {
  test("ships the pre-selected theme families", () => {
    deepStrictEqual(
      CODE_BLOCK_THEME_FAMILIES.map((family) => family.value),
      ["github", "catppuccin", "nord", "everforest", "tokyo-night"]
    );
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
      strictEqual(isCodeBlockThemeFamily(family.value), true);
    }
    strictEqual(isCodeBlockThemeFamily("dracula"), false);
  });

  test("every family resolves a theme id per mode", () => {
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
      if (family.value === "nord" || family.value === "tokyo-night") {
        // Single-variant dark-only Shiki themes stay pinned in both modes.
        strictEqual(
          resolveCodeBlockThemeId(family.value, "light"),
          `${family.value}-dark`
        );
        strictEqual(
          resolveCodeBlockThemeId(family.value, "dark"),
          `${family.value}-dark`
        );
        continue;
      }
      strictEqual(
        resolveCodeBlockThemeId(family.value, "light"),
        `${family.value}-light`
      );
      strictEqual(
        resolveCodeBlockThemeId(family.value, "dark"),
        `${family.value}-dark`
      );
    }
  });

  test("nord-dark is the default in both modes", () => {
    strictEqual(DEFAULT_CODE_BLOCK_THEME_FAMILY, "nord");
    strictEqual(
      resolveCodeBlockThemeId(DEFAULT_CODE_BLOCK_THEME_FAMILY, "light"),
      "nord-dark"
    );
    strictEqual(
      resolveCodeBlockThemeId(DEFAULT_CODE_BLOCK_THEME_FAMILY, "dark"),
      "nord-dark"
    );
  });

  test("every resolved theme id provides background, foreground, and gutter colors", () => {
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
      for (const mode of ["light", "dark"] as const) {
        const themeId = resolveCodeBlockThemeId(family.value, mode);
        const bg = getCodeBlockBackground(themeId);
        const fg = getCodeBlockForeground(themeId);
        const gutter = getCodeBlockGutterColor(themeId);
        ok(bg.length > 0, `${themeId} missing background`);
        ok(fg.length > 0, `${themeId} missing foreground`);
        ok(gutter.length > 0, `${themeId} missing gutter`);
      }
    }
  });

  test("github blocks use the shadcn card surface token", () => {
    strictEqual(
      getCodeBlockBackground("github-light"),
      "var(--card, oklch(1 0 0))"
    );
    strictEqual(
      getCodeBlockBackground("github-dark"),
      "var(--card, oklch(0.205 0 0))"
    );
  });

  test("unknown theme ids normalize to nord-dark", () => {
    strictEqual(normalizeCodeBlockThemeId("not-a-theme"), "nord-dark");
    strictEqual(getCodeBlockBackground("not-a-theme"), "#2e3440");
    strictEqual(getCodeBlockForeground("not-a-theme"), "#d8dee9");
    strictEqual(getCodeBlockGutterColor("not-a-theme"), "#4c566a");
  });

  test("getFamilyCodeBlockThemeIds returns sibling mode variants only when supported", () => {
    deepStrictEqual(getFamilyCodeBlockThemeIds("nord-dark"), ["nord-dark"]);
    deepStrictEqual(getFamilyCodeBlockThemeIds("tokyo-night-dark"), [
      "tokyo-night-dark",
    ]);
    deepStrictEqual(getFamilyCodeBlockThemeIds("github-light"), [
      "github-light",
      "github-dark",
    ]);
    deepStrictEqual(getFamilyCodeBlockThemeIds("catppuccin-dark"), [
      "catppuccin-light",
      "catppuccin-dark",
    ]);
    deepStrictEqual(getFamilyCodeBlockThemeIds("everforest-light"), [
      "everforest-light",
      "everforest-dark",
    ]);
  });

  test("fine-grained Shiki theme loaders resolve valid registrations for all pre-selected themes", async () => {
    const entries = Object.entries(SHIKI_THEME_LOADERS);
    strictEqual(entries.length, 10);
    for (const [themeId, loader] of entries) {
      const mod = await loader();
      ok(
        mod.default && typeof mod.default.name === "string",
        `${themeId} loader did not resolve a Shiki ThemeRegistration`
      );
      ok(
        Array.isArray(mod.default.tokenColors) ||
          Array.isArray(mod.default.settings),
        `${themeId} registration is missing tokenColors/settings`
      );
    }
  });

  test("fine-grained Shiki highlighter loads requested themes and languages on demand", async () => {
    const highlighter = getShikiHighlighter();
    ok(highlighter !== null);

    await loadCodeTheme("nord-dark");
    await loadCodeLanguage("ts");

    strictEqual(isCodeThemeLoaded("nord-dark"), true);
    strictEqual(isCodeLanguageLoaded("typescript"), true);
    ok(highlighter.getLoadedThemes().includes("nord-dark"));
    ok(highlighter.getLoadedLanguages().includes("typescript"));

    const lines = tokenizeCodeLines("const x = 1;", "ts", "nord-dark");
    ok(lines !== null && lines.length === 1);
    const firstLine = lines[0] ?? [];
    strictEqual(firstLine.map((t) => t.text).join(""), "const x = 1;");
    ok(
      firstLine.some((t) => t.style.toLowerCase().includes("#81a1c1")),
      "expected Nord keyword color (#81a1c1) on `const`"
    );

    await loadCodeThemeFamily("github-light");
    strictEqual(isCodeThemeLoaded("github-light"), true);
    strictEqual(isCodeThemeLoaded("github-dark"), true);
  });
});
