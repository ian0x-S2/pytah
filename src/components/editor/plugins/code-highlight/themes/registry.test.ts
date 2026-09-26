import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  CODE_BLOCK_THEME_FAMILIES,
  getCodeBlockPalette,
  getCodeBlockStyles,
  getCodeBlockTokenStyle,
  isCodeBlockThemeFamily,
  resolveCodeBlockThemeId,
} from "./registry";

const REQUIRED_TOKENS = [
  "background_color",
  "identifier",
  "keyword",
  "string",
  "comment",
  "number",
  "function",
  "operator",
  "punctuation",
] as const;

describe("code-block theme registry", () => {
  test("ships the builtin family plus the two local themes", () => {
    deepStrictEqual(
      CODE_BLOCK_THEME_FAMILIES.map((family) => family.value),
      ["github", "catppuccin", "nord", "everforest"]
    );
  });

  test("every family resolves a light and a dark theme id", () => {
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
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

  test("every theme id carries the core token colors", () => {
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
      for (const mode of ["light", "dark"] as const) {
        const palette = getCodeBlockPalette(
          resolveCodeBlockThemeId(family.value, mode)
        );
        for (const token of REQUIRED_TOKENS) {
          ok(
            typeof palette[token] === "string" && palette[token] !== "",
            `${family.value}-${mode} is missing ${token}`
          );
        }
      }
    }
  });

  test("unknown theme ids fall back to a usable palette", () => {
    const palette = getCodeBlockPalette("not-a-theme");
    ok(typeof palette["background_color"] === "string");
  });

  test("token styles carry the palette color", () => {
    const style = getCodeBlockTokenStyle("nord-dark", "keyword");
    ok(style.includes("#81A1C1"));
  });

  test("italic themes mark comments italic", () => {
    for (const theme of [
      "catppuccin-dark",
      "nord-dark",
      "everforest-dark",
    ] as const) {
      const styles = getCodeBlockStyles(theme);
      deepStrictEqual(styles["comment"], ["italic"]);
    }
  });

  test("family guard accepts known values only", () => {
    strictEqual(isCodeBlockThemeFamily("nord"), true);
    strictEqual(isCodeBlockThemeFamily("solarized"), false);
    strictEqual(isCodeBlockThemeFamily(null), false);
  });
});
