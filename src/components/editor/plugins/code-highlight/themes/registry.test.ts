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

const hexToRgbChannels = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    Math.floor(value / 65_536) % 256,
    Math.floor(value / 256) % 256,
    value % 256,
  ];
};

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgbChannels(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};

const contrastRatio = (foreground: string, background: string): number => {
  const light = relativeLuminance(foreground);
  const dark = relativeLuminance(background);
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
};

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
    ok(style.includes("#9ACAD7"));
  });

  test("nord primaries meet AAA in both modes", () => {
    // TSX sample tokens: these must pop at AAA so keywords/strings/
    // functions stay readable in small mono. Everforest is exempt: it
    // copies the official VS Code reference verbatim (which sits below
    // AA on purpose) and is pinned by the test below instead.
    const primaries = [
      "keyword",
      "string",
      "function",
      "tag_name",
      "attr_name",
      "tag",
    ] as const;
    for (const mode of ["light", "dark"] as const) {
      const id = resolveCodeBlockThemeId("nord", mode);
      const palette = getCodeBlockPalette(id);
      const background = palette["background_color"] ?? "";
      for (const token of primaries) {
        const color = palette[token] ?? "";
        ok(
          contrastRatio(color, background) >= 7,
          `${id} ${token} ${color} on ${background} is below AAA`
        );
      }
      // Every text token stays at least AA; muted/comments are allowed
      // to sit below AAA (de-emphasized by design).
      for (const [token, color] of Object.entries(palette)) {
        if (token === "background_color" || color === "inherit") {
          continue;
        }
        ok(
          contrastRatio(color, background) >= 4.5,
          `${id} ${token} ${color} on ${background} is below AA`
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
