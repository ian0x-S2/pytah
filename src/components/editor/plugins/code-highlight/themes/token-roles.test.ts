import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { tokenize as tokenizeTsx } from "@twinkleplop/tsx";

import { getCodeBlockPalette } from "./registry";
import { resolveThemedTokenType } from "./token-roles";

/**
 * The reference rendering for this TSX sample (VS Code Everforest):
 * module keywords plain, `from`/`return` red, PascalCase values as
 * types, strings gold, JSX brackets orange, props plain.
 */
const SAMPLE = `import { Editor } from "@/components/editor/editor";
export function App() {
  return <Editor editable />;
}`;

/** Raw Twinkleplop type -> resolved display type for the sample above. */
interface ExpectedToken {
  raw: string;
  resolved: string;
  text: string;
}

const EXPECTED_RESOLVED_TYPES: readonly ExpectedToken[] = [
  { raw: "keyword", resolved: "identifier", text: "import" },
  { raw: "punctuation", resolved: "punctuation", text: "{" },
  { raw: "identifier", resolved: "type", text: "Editor" },
  { raw: "punctuation", resolved: "punctuation", text: "}" },
  { raw: "keyword", resolved: "keyword", text: "from" },
  { raw: "string", resolved: "string", text: '"@/components/editor/editor"' },
  { raw: "punctuation", resolved: "punctuation", text: ";" },
  { raw: "keyword", resolved: "identifier", text: "export" },
  { raw: "keyword", resolved: "identifier", text: "function" },
  { raw: "function", resolved: "type", text: "App" },
  { raw: "punctuation", resolved: "punctuation", text: "()" },
  { raw: "punctuation", resolved: "punctuation", text: "{" },
  { raw: "keyword", resolved: "keyword", text: "return" },
  { raw: "punctuation", resolved: "operator", text: "<" },
  { raw: "tag_name", resolved: "type", text: "Editor" },
  { raw: "attr_name", resolved: "identifier", text: "editable" },
  { raw: "punctuation", resolved: "operator", text: "/>;" },
  { raw: "punctuation", resolved: "punctuation", text: "}" },
];

const tokenStream = (): [string, string][] => {
  const tokenize = tokenizeTsx();
  const result = tokenize(SAMPLE);
  const out: [string, string][] = [];
  for (let i = 0; i < result.tokens.length; i += 3) {
    const typeIndex = result.tokens[i] as number;
    const start = result.tokens[i + 1] as number;
    const end = result.tokens[i + 2] as number;
    out.push([
      SAMPLE.slice(start, end),
      result.token_types[typeIndex] ?? "identifier",
    ]);
  }
  return out;
};

describe("everforest token roles", () => {
  test("tsx sample resolves toward the reference rendering", () => {
    const stream = tokenStream();
    deepStrictEqual(
      stream.map(([text]) => text),
      EXPECTED_RESOLVED_TYPES.map((expected) => expected.text)
    );
    deepStrictEqual(
      stream.map(([, raw]) => raw),
      EXPECTED_RESOLVED_TYPES.map((expected) => expected.raw)
    );
    deepStrictEqual(
      stream.map(([text, raw]) =>
        resolveThemedTokenType("everforest-dark", "tsx", raw, text)
      ),
      EXPECTED_RESOLVED_TYPES.map((expected) => expected.resolved)
    );
  });

  test("resolved sample carries the reference colors in both modes", () => {
    const expectedColors: Record<string, Record<string, string>> = {
      "everforest-dark": {
        identifier: "#d3c6aa",
        keyword: "#e67e80",
        operator: "#e69875",
        punctuation: "#d3c6aa",
        string: "#dbbc7f",
        type: "#7fbbb3",
      },
      "everforest-light": {
        identifier: "#5c6a72",
        keyword: "#f85552",
        operator: "#f57d26",
        punctuation: "#5c6a72",
        string: "#dfa000",
        type: "#3a94c5",
      },
    };
    for (const [theme, colors] of Object.entries(expectedColors)) {
      const palette = getCodeBlockPalette(theme);
      for (const expected of EXPECTED_RESOLVED_TYPES) {
        strictEqual(
          (palette[expected.resolved] ?? "").toLowerCase(),
          (colors[expected.resolved] ?? "").toLowerCase(),
          `${theme} ${expected.resolved} drifted from the reference color`
        );
      }
    }
  });

  test("other families keep the raw grammar roles", () => {
    for (const [text, raw] of tokenStream()) {
      strictEqual(resolveThemedTokenType("github-dark", "tsx", raw, text), raw);
      strictEqual(
        resolveThemedTokenType("catppuccin-light", "tsx", raw, text),
        raw
      );
    }
  });

  test("other languages keep the raw grammar roles", () => {
    strictEqual(
      resolveThemedTokenType("everforest-dark", "python", "keyword", "import"),
      "keyword"
    );
    strictEqual(
      resolveThemedTokenType("everforest-dark", "html", "tag_name", "div"),
      "tag_name"
    );
    // Lowercase values stay on their grammar role even in tsx.
    strictEqual(
      resolveThemedTokenType("everforest-dark", "tsx", "identifier", "count"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("everforest-dark", "tsx", "function", "render"),
      "function"
    );
  });
});

describe("nord token roles", () => {
  test("tsx sample resolves brackets, terminators, and tags to frost blue", () => {
    const expected: Record<string, string> = {
      "/>": "operator",
      "/>;": "operator",
      ";": "operator",
      "<": "operator",
      Editor_tag: "tag",
      editable: "identifier",
      export: "identifier",
      function: "identifier",
    };
    for (const [text, raw] of tokenStream()) {
      const resolved = resolveThemedTokenType("nord-dark", "tsx", raw, text);
      if (text === "Editor" && raw === "tag_name") {
        strictEqual(resolved, expected["Editor_tag"]);
      } else if (expected[text] === undefined) {
        // Control-flow/module keywords, values, strings, and structural
        // punctuation keep their raw grammar roles.
        strictEqual(resolved, raw, `nord tsx ${text}`);
      } else {
        strictEqual(resolved, expected[text], `nord tsx ${text}`);
      }
    }
    // Spot-check the headline resolutions explicitly.
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "tag_name", "Editor"),
      "tag"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "punctuation", "<"),
      "operator"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "punctuation", ";"),
      "operator"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "import"),
      "keyword"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "from"),
      "keyword"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "return"),
      "keyword"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "export"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "function"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "const"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "let"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "keyword", "var"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "constant", "first"),
      "identifier"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "function", "App"),
      "function"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "tsx", "attr_name", "editable"),
      "identifier"
    );
  });

  test("resolved sample carries frost blue brackets in both modes", () => {
    // Dark uses the verbatim reference blue; light uses the 6.0-shaded
    // descendant of the same hue.
    const expected: Record<string, Record<string, string>> = {
      "nord-dark": { operator: "#81a1c1", tag: "#81a1c1" },
      "nord-light": { operator: "#495b6f", tag: "#495b6f" },
    };
    for (const [theme, colors] of Object.entries(expected)) {
      const palette = getCodeBlockPalette(theme);
      for (const [token, color] of Object.entries(colors)) {
        strictEqual(
          (palette[token] ?? "").toLowerCase(),
          color.toLowerCase(),
          `${theme} ${token} drifted from frost blue`
        );
      }
    }
  });

  test("nord overrides stay out of other languages", () => {
    strictEqual(
      resolveThemedTokenType("nord-dark", "css", "punctuation", ";"),
      "punctuation"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "html", "tag_name", "div"),
      "tag_name"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "html", "attr_name", "class"),
      "attr_name"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "python", "keyword", "export"),
      "keyword"
    );
    strictEqual(
      resolveThemedTokenType("nord-dark", "python", "constant", "first"),
      "constant"
    );
  });
});
