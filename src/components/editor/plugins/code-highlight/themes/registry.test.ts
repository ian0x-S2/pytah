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
    ok(style.includes("#81a1c1"));
  });

  test("nord copies the official VS Code reference", () => {
    // Spot-checks against arcticicestudio/nord tokenColors; the full map
    // lives in nord.ts. CASE: official hexes are lowercase. Dark is the
    // verbatim reference; light reuses the same hues on Snow Storm.
    const expected: Record<string, Record<string, string>> = {
      "nord-dark": {
        attr_name: "#8fbcbb",
        background_color: "#2e3440",
        boolean: "#81a1c1",
        changed: "#ebcb8b",
        comment: "#616e88",
        decorator: "#d08770",
        deleted: "#bf616a",
        directive: "#5e81ac",
        function: "#88c0d0",
        identifier: "#d8dee9",
        inserted: "#a3be8c",
        keyword: "#81a1c1",
        number: "#b48ead",
        operator: "#81a1c1",
        punctuation: "#eceff4",
        string: "#a3be8c",
        tag: "#81a1c1",
        tag_name: "#8fbcbb",
        type: "#8fbcbb",
      },
      "nord-light": {
        background_color: "#eceff4",
        comment: "#4c566a",
        function: "#88c0d0",
        identifier: "#3b4252",
        keyword: "#81a1c1",
        number: "#b48ead",
        punctuation: "#2e3440",
        string: "#a3be8c",
        type: "#8fbcbb",
      },
    };
    for (const [id, tokens] of Object.entries(expected)) {
      const palette = getCodeBlockPalette(id);
      for (const [token, color] of Object.entries(tokens)) {
        strictEqual(
          (palette[token] ?? "").toLowerCase(),
          color.toLowerCase(),
          `${id} ${token} drifted from the official reference`
        );
      }
    }
  });

  test("everforest copies the official VS Code reference", () => {
    // Spot-checks against sainnhe/everforest tokenColors; the full map
    // lives in everforest.ts. CASE: official hexes are lowercase.
    const expected: Record<string, Record<string, string>> = {
      "everforest-dark": {
        attr_name: "#dbbc7f",
        background_color: "#2d353b",
        comment: "#859289",
        function: "#a7c080",
        keyword: "#e67e80",
        number: "#d699b6",
        operator: "#e69875",
        punctuation: "#d3c6aa",
        string: "#dbbc7f",
        tag: "#e69875",
        tag_name: "#a7c080",
        type: "#7fbbb3",
      },
      "everforest-light": {
        attr_name: "#dfa000",
        background_color: "#fdf6e3",
        comment: "#939f91",
        function: "#8da101",
        keyword: "#f85552",
        number: "#df69ba",
        operator: "#f57d26",
        punctuation: "#5c6a72",
        string: "#dfa000",
        tag: "#f57d26",
        tag_name: "#8da101",
        type: "#3a94c5",
      },
    };
    for (const [id, tokens] of Object.entries(expected)) {
      const palette = getCodeBlockPalette(id);
      for (const [token, color] of Object.entries(tokens)) {
        strictEqual(
          (palette[token] ?? "").toLowerCase(),
          color.toLowerCase(),
          `${id} ${token} drifted from the official reference`
        );
      }
    }
  });

  test("italic themes mark comments italic", () => {
    // Nord is excluded: the official reference specifies no fontStyle
    // for comments, so they render upright.
    for (const theme of ["catppuccin-dark", "everforest-dark"] as const) {
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
