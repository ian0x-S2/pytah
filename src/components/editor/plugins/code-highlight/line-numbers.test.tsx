import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// DOM globals must exist before React and Lexical evaluate their
// CAN_USE_DOM checks, so this file registers happy-dom up front and imports
// the browser-dependent modules dynamically afterwards.
GlobalRegistrator.register();
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement, useState } = await import("react");
const { createRoot } = await import("react-dom/client");
const { LexicalComposer } = await import("@lexical/react/LexicalComposer");
const { ContentEditable } =
  await import("@lexical/react/LexicalContentEditable");
const { LexicalErrorBoundary } =
  await import("@lexical/react/LexicalErrorBoundary");
const { RichTextPlugin } = await import("@lexical/react/LexicalRichTextPlugin");
const { $createCodeNode } = await import("@lexical/code");
const { $createParagraphNode, $createTextNode, $getRoot } =
  await import("lexical");
const { createEditorConfig } = await import("../../core/config");
const { ThemeContext } = await import("@/components/theme-context");
const { CodeGutterHostContext } = await import("./gutter-host");
const { CodeLineNumbersPlugin } = await import("./line-numbers");

after(() => {
  GlobalRegistrator.unregister();
});

const themeContextValue = {
  resolvedTheme: "light",
  setTheme: () => {},
  theme: "light",
} as const;

const renderWithCode = async (codeText: string) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const config = createEditorConfig({
    editable: true,
    editorState: () => {
      $getRoot().append($createParagraphNode());
      const code = $createCodeNode("tsx");
      code.append($createTextNode(codeText));
      $getRoot().append(code);
    },
    featureNodes: [],
  });

  // Mirrors the composition surface: a positioned wrapper owns the
  // gutter host element, shared through context.
  const Harness = () => {
    const [host, setHost] = useState<HTMLElement | null>(null);
    return createElement(
      ThemeContext.Provider,
      { value: themeContextValue },
      createElement(
        LexicalComposer,
        { initialConfig: config },
        createElement(
          "div",
          { style: { position: "relative" } },
          createElement(RichTextPlugin, {
            ErrorBoundary: LexicalErrorBoundary,
            contentEditable: createElement(ContentEditable),
          }),
          createElement("div", { ref: setHost }),
          createElement(
            CodeGutterHostContext.Provider,
            { value: host },
            createElement(CodeLineNumbersPlugin)
          )
        )
      )
    );
  };

  await act(() => {
    root.render(createElement(Harness));
  });

  return { container, root };
};

describe("CodeLineNumbersPlugin", () => {
  test("renders one number per code line", async () => {
    const { container } = await renderWithCode("one\ntwo\nthree");
    await act(() => {});
    const gutter = container.querySelector("[data-code-gutter]");
    if (!gutter) {
      throw new Error("gutter overlay missing");
    }
    const numbers = [...gutter.querySelectorAll("span")].map(
      (span) => span.textContent
    );
    deepStrictEqual(numbers, ["1", "2", "3"]);
    const codeElement = container.querySelector("code");
    if (!(codeElement instanceof HTMLElement)) {
      throw new Error("code element missing");
    }
    strictEqual(codeElement.dataset.codeGutterBase !== undefined, true);
    strictEqual(codeElement.style.paddingLeft.includes("calc("), true);
  });

  test("single-line code renders a single number", async () => {
    const { container } = await renderWithCode("const x = 1;");
    await act(() => {});
    const gutter = container.querySelector("[data-code-gutter]");
    if (!gutter) {
      throw new Error("gutter overlay missing");
    }
    strictEqual(gutter.querySelectorAll("span").length, 1);
  });
});
