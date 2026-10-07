import { deepStrictEqual, ok, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import {
  CODE_BLOCK_THEME_FAMILIES,
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  getCodeBlockPalette,
  getCodeBlockStyles,
  getCodeBlockTokenStyle,
  getCodeBlockTokenVars,
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

const luminanceChannel = (hex: string, index: number): number => {
  const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const hexToLuminance = (hex: string): number =>
  0.2126 * luminanceChannel(hex, 1) +
  0.7152 * luminanceChannel(hex, 3) +
  0.0722 * luminanceChannel(hex, 5);

describe("code-block theme registry", () => {
  test("ships the builtin family plus the two local themes", () => {
    deepStrictEqual(
      CODE_BLOCK_THEME_FAMILIES.map((family) => family.value),
      ["github", "catppuccin", "nord", "everforest"]
    );
  });

  test("every family resolves a theme id per mode", () => {
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
      if (family.value === "nord") {
        // Pinned to the dark-only reference in both modes.
        strictEqual(
          resolveCodeBlockThemeId(family.value, "light"),
          "nord-dark"
        );
        strictEqual(resolveCodeBlockThemeId(family.value, "dark"), "nord-dark");
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

  test("token styles reference the palette color var", () => {
    // Colors are var references resolved by `EditorContent`'s wrapper vars
    // (`getCodeBlockTokenVars`), not baked hex: token nodes stay
    // theme-agnostic so mode toggles diff to a no-op.
    const style = getCodeBlockTokenStyle("nord-dark", "keyword");
    ok(style.includes("var(--editor-code-token-keyword)"));
  });

  test("token vars cover the palette for each resolved theme id", () => {
    for (const family of CODE_BLOCK_THEME_FAMILIES) {
      for (const mode of ["light", "dark"] as const) {
        const id = resolveCodeBlockThemeId(family.value, mode);
        const vars = getCodeBlockTokenVars(id);
        const palette = getCodeBlockPalette(id);
        for (const [token, color] of Object.entries(palette)) {
          if (token === "background_color") {
            continue;
          }
          strictEqual(
            vars[`--editor-code-token-${token}`],
            color,
            `${id} missing var for ${token}`
          );
        }
      }
    }
  });

  test("nord copies the official VS Code reference", () => {
    // Spot-checks against arcticicestudio/nord tokenColors; the full map
    // lives in nord.ts. CASE: official hexes are lowercase. Dark is the
    // verbatim reference; light shades each hue toward black to hold
    // WCAG AA (see the contrast floor test below).
    // `tag_name` shares the blue `entity.name.tag` rule, `blockquote_marker`
    // the teal quote rule, and `gutter` the block chrome
    // (`editorLineNumber.foreground`).
    const expected: Record<string, Record<string, string>> = {
      "nord-dark": {
        attr_name: "#8fbcbb",
        background_color: "#2e3440",
        blockquote_marker: "#8fbcbb",
        boolean: "#81a1c1",
        changed: "#ebcb8b",
        comment: "#616e88",
        decorator: "#d08770",
        deleted: "#bf616a",
        directive: "#5e81ac",
        function: "#88c0d0",
        gutter: "#4c566a",
        identifier: "#d8dee9",
        inserted: "#a3be8c",
        keyword: "#81a1c1",
        number: "#b48ead",
        operator: "#81a1c1",
        punctuation: "#eceff4",
        string: "#a3be8c",
        tag: "#81a1c1",
        tag_name: "#81a1c1",
        type: "#8fbcbb",
      },
      "nord-light": {
        background_color: "#eceff4",
        blockquote_marker: "#475e5e",
        comment: "#4c566a",
        function: "#425e67",
        gutter: "#4c566a",
        identifier: "#3b4252",
        keyword: "#495b6f",
        number: "#6a5266",
        punctuation: "#2e3440",
        string: "#505e44",
        tag: "#495b6f",
        tag_name: "#495b6f",
        type: "#475e5e",
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

  test("nord-light holds the 6.0 contrast floor on Snow Storm", () => {
    // Light trades exact hues for readability: every painted token must
    // reach 6.0:1 against `background_color` — AA with margin. Dark stays
    // verbatim and is intentionally exempt.
    const palette = getCodeBlockPalette("nord-light");
    const bg = palette["background_color"] ?? "#eceff4";
    const bgLum = hexToLuminance(bg);
    for (const [token, color] of Object.entries(palette)) {
      if (token === "background_color" || color === "inherit") {
        continue;
      }
      const lum = hexToLuminance(color);
      const ratio =
        (Math.max(lum, bgLum) + 0.05) / (Math.min(lum, bgLum) + 0.05);
      ok(
        ratio >= 6,
        `nord-light ${token} (${color}) is ${ratio.toFixed(2)}:1, below 6.0`
      );
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

  test("nord underlines markdown links like markup.underline.link", () => {
    for (const theme of ["nord-dark", "nord-light"] as const) {
      const styles = getCodeBlockStyles(theme);
      for (const token of [
        "autolink",
        "link_text",
        "url",
        "url_link",
        "url_title",
      ] as const) {
        deepStrictEqual(styles[token], ["underline"], `${theme} ${token}`);
      }
    }
  });

  test("family guard accepts known values only", () => {
    strictEqual(isCodeBlockThemeFamily("nord"), true);
    strictEqual(isCodeBlockThemeFamily("solarized"), false);
    strictEqual(isCodeBlockThemeFamily(null), false);
  });
});
