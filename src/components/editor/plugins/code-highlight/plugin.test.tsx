import {
  deepStrictEqual,
  notDeepStrictEqual,
  ok,
  strictEqual,
} from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { CodeNode } from "@lexical/code";
import type { Tokenizer } from "@lexical/code-shiki";
import type { LexicalEditor, LexicalNode } from "lexical";

// DOM globals must exist before React and Lexical evaluate their
// CAN_USE_DOM checks, so this file registers happy-dom up front and imports
// the browser-dependent modules dynamically afterwards.
GlobalRegistrator.register();
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement, Fragment, useEffect } = await import("react");
const { createRoot } = await import("react-dom/client");
const { useLexicalComposerContext } =
  await import("@lexical/react/LexicalComposerContext");
const { LexicalComposer } = await import("@lexical/react/LexicalComposer");
const {
  $createCodeNode,
  $isCodeNode,
  $isCodeHighlightNode,
  CodeHighlightNode,
} = await import("@lexical/code");
const {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
} = await import("lexical");
const { createEditorConfig } = await import("../../core/config");
const { resolveEditorFeatures } = await import("../../core/composition");
const { getCodeBlockTokenStyle } = await import("./themes/registry");
const { TwinkleplopTokenizer } = await import("./twinkleplop-tokenizer");
const { ThemeContext } = await import("@/components/theme-context");
const { EditorContent } = await import("../../ui/content");
const { CodeHighlightPlugin } = await import("./plugin");
const { useCodeBlockTheme } = await import("./theme-context");

const CODE_SNIPPET = "const answer = 42;";

// requestAnimationFrame is stubbed so the test controls when the arm frame
// fires; happy-dom's implementations are restored afterwards.
let frameIdCounter = 0;
const pendingFrames = new Map<number, FrameRequestCallback>();
const originalRaf = globalThis.requestAnimationFrame;
const originalCancelRaf = globalThis.cancelAnimationFrame;

globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  frameIdCounter += 1;
  pendingFrames.set(frameIdCounter, callback);
  return frameIdCounter;
};
globalThis.cancelAnimationFrame = (id: number): void => {
  pendingFrames.delete(id);
};

const fireFrames = () => {
  const callbacks = [...pendingFrames.values()];
  pendingFrames.clear();
  for (const callback of callbacks) {
    callback(0);
  }
};

after(() => {
  globalThis.requestAnimationFrame = originalRaf;
  globalThis.cancelAnimationFrame = originalCancelRaf;
  GlobalRegistrator.unregister();
});

interface ThemeContextValue {
  resolvedTheme: "light" | "dark";
  setTheme: () => void;
  theme: "light" | "dark";
}

const themeContextValue = (
  resolvedTheme: "light" | "dark"
): ThemeContextValue => ({
  resolvedTheme,
  setTheme: () => {},
  theme: resolvedTheme,
});

let editorRef: LexicalEditor | null = null;
let rootRef: ReturnType<typeof createRoot> | null = null;
let containerRef: HTMLElement | null = null;

const EditorProbe = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editorRef = editor;
  }, [editor]);
  return null;
};

const renderCodeHighlightPlugin = async (
  resolvedTheme: "light" | "dark",
  seed?: () => void,
  themeFamily?: ChromeThemeFamily
) => {
  containerRef = document.createElement("div");
  document.body.append(containerRef);
  rootRef = createRoot(containerRef);

  const config = createEditorConfig({
    editable: true,
    editorState:
      seed ??
      (() => {
        const code = $createCodeNode("ts");
        code.append($createTextNode(CODE_SNIPPET));
        $getRoot().append(code);
      }),
    featureNodes: [],
  });

  await act(() => {
    rootRef?.render(
      createElement(
        ThemeContext.Provider,
        { value: themeContextValue(resolvedTheme) },
        createElement(
          LexicalComposer,
          { initialConfig: config },
          createElement(EditorProbe),
          createElement(CodeHighlightPlugin, { themeFamily })
        )
      )
    );
  });
};

// Re-renders with a different resolved theme, as the theme toggle does.
const rerenderWithTheme = async (
  resolvedTheme: "light" | "dark",
  themeFamily?: ChromeThemeFamily
) => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [],
  });
  await act(() => {
    rootRef?.render(
      createElement(
        ThemeContext.Provider,
        { value: themeContextValue(resolvedTheme) },
        createElement(
          LexicalComposer,
          { initialConfig: config },
          createElement(EditorProbe),
          createElement(CodeHighlightPlugin, { themeFamily })
        )
      )
    );
  });
};

const readCodeNode = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      if ($isCodeNode(child)) {
        return {
          childTypes: child
            .getChildren()
            .map((node: LexicalNode) => node.getType()),
          theme: child.getTheme(),
        };
      }
    }
    return null;
  });

const pollUntil = async (
  read: () => boolean,
  attempts = 240,
  delayMs = 25
): Promise<boolean> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (read()) {
      return true;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
  return false;
};

const pollForHighlightNodes = (): Promise<boolean> =>
  pollUntil(() => {
    const snapshot = editorRef ? readCodeNode(editorRef) : null;
    return (
      snapshot?.childTypes.some(
        (type) => type === CodeHighlightNode.getType()
      ) ?? false
    );
  });

const readSelectionAnchor = (
  editor: LexicalEditor
): { key: string; offset: number; type: string } | null =>
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return null;
    }
    return {
      key: selection.anchor.key,
      offset: selection.anchor.offset,
      type: selection.anchor.type,
    };
  });

const readCodeChildKeys = (editor: LexicalEditor): string[] | null =>
  editor.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      if ($isCodeNode(child)) {
        return child.getChildren().map((node: LexicalNode) => node.getKey());
      }
    }
    return null;
  });

const readCodeHighlightTypes = (editor: LexicalEditor): string[] | null =>
  editor.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      if ($isCodeNode(child)) {
        return child
          .getChildren()
          .flatMap((node: LexicalNode) =>
            $isCodeHighlightNode(node) ? [node.getHighlightType() ?? ""] : []
          );
      }
    }
    return null;
  });

describe("CodeHighlightPlugin arming", () => {
  test("mount paints plain code first; highlighting arms after the arm frames", async () => {
    try {
      await renderCodeHighlightPlugin("light");
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          resolve();
        });
      });

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      // Before the arm frames fire, the code block is plain text: no
      // CodeHighlightNodes and the themed retheme update has not run.
      const beforeArm = readCodeNode(editorRef);
      deepStrictEqual(beforeArm?.childTypes, ["text"]);
      strictEqual(beforeArm?.theme !== "nord-dark", true);

      // Fire the double-rAF arm; the arming effect then preloads the
      // highlighter assets and, once loaded, registers Shiki highlighting
      // and applies the theme inline.
      await act(() => {
        fireFrames();
        fireFrames();
      });

      // Asset loading is async; wait for the themed highlight nodes.
      const highlighted = await pollForHighlightNodes();
      strictEqual(highlighted, true);

      const afterArm = readCodeNode(editorRef);
      strictEqual(afterArm?.theme, "nord-dark");
    } finally {
      pendingFrames.clear();
    }
  });

  test("highlighting stays unarmed when the arm frames never fire", async () => {
    try {
      await renderCodeHighlightPlugin("light");
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          resolve();
        });
      });

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      // Give any (incorrectly) eager registration plenty of event-loop
      // turns to tokenize; nothing should appear without the arm frames.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 25);
        });
      }

      const beforeArm = readCodeNode(editorRef);
      deepStrictEqual(beforeArm?.childTypes, ["text"]);
      strictEqual(beforeArm?.theme !== "nord-dark", true);
    } finally {
      pendingFrames.clear();
    }
  });

  test("tokenization never relocates a selection that lives outside the code block", async () => {
    try {
      await renderCodeHighlightPlugin("light", () => {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode("Intro paragraph"));
        $getRoot().append(paragraph);
        const code = $createCodeNode("ts");
        code.append($createTextNode(CODE_SNIPPET));
        $getRoot().append(code);
      });
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          resolve();
        });
      });

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      // Simulate the mount caret (FocusOnMountPlugin): a collapsed selection
      // on the intro text, placed before highlighting arms.
      await act(() => {
        editorRef?.update(() => {
          const paragraph = $getRoot().getFirstChild();
          if (!$isParagraphNode(paragraph)) {
            return;
          }
          const text = paragraph.getFirstChild();
          if (text && $isTextNode(text)) {
            text.select(0, 0);
          }
        });
      });

      const anchorBefore = readSelectionAnchor(editorRef);
      if (!anchorBefore) {
        throw new Error("selection was not placed");
      }

      await act(() => {
        fireFrames();
        fireFrames();
      });

      // Highlighting must still apply.
      const highlighted = await pollForHighlightNodes();
      strictEqual(highlighted, true);

      // ...but the caret stays exactly where it was: upstream's
      // $updateAndRetainSelection must never pull an out-of-node selection
      // into the code block (mount scroll jump root cause).
      const anchorAfter = readSelectionAnchor(editorRef);
      deepStrictEqual(anchorAfter, anchorBefore);
    } finally {
      pendingFrames.clear();
    }
  });

  test("theme toggle re-tokenizes without relocating an out-of-node selection", async () => {
    try {
      // Explicit GitHub family so the mode toggle flips the resolved id
      // (the nord default is pinned dark in both modes).
      await renderCodeHighlightPlugin(
        "light",
        () => {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode("Intro paragraph"));
          $getRoot().append(paragraph);
          const code = $createCodeNode("ts");
          code.append($createTextNode(CODE_SNIPPET));
          $getRoot().append(code);
        },
        "github"
      );
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          resolve();
        });
      });

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      await act(() => {
        editorRef?.update(() => {
          const paragraph = $getRoot().getFirstChild();
          if (!$isParagraphNode(paragraph)) {
            return;
          }
          const text = paragraph.getFirstChild();
          if (text && $isTextNode(text)) {
            text.select(0, 0);
          }
        });
      });

      const anchorBefore = readSelectionAnchor(editorRef);
      if (!anchorBefore) {
        throw new Error("selection was not placed");
      }

      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);
      strictEqual(readCodeNode(editorRef)?.theme, "github-light");

      // Capture the tokenized structure: a mode-only flip must not splice.
      const childKeysBefore = readCodeChildKeys(editorRef);
      const highlightTypesBefore = readCodeHighlightTypes(editorRef);
      ok(childKeysBefore !== null && highlightTypesBefore !== null);

      // Toggle to dark: the theme transform re-registers, marks the code
      // nodes dirty and re-tokenizes. The out-of-node caret must survive.
      await rerenderWithTheme("dark", "github");

      const toggled = await pollUntil(
        () =>
          readCodeNode(editorRef ?? (undefined as never))?.theme ===
          "github-dark"
      );
      strictEqual(toggled, true);
      strictEqual(await pollForHighlightNodes(), true);

      // Mode-only flips never splice: token colors are wrapper vars and the
      // role resolver is family-gated, so the children (and their node keys)
      // survive the toggle untouched.
      deepStrictEqual(
        readCodeChildKeys(editorRef as LexicalEditor),
        childKeysBefore
      );
      deepStrictEqual(
        readCodeHighlightTypes(editorRef as LexicalEditor),
        highlightTypesBefore
      );

      const anchorAfterToggle = readSelectionAnchor(editorRef);
      deepStrictEqual(anchorAfterToggle, anchorBefore);
    } finally {
      pendingFrames.clear();
    }
  });

  test("mode-only theme flips skip re-tokenization entirely", async () => {
    try {
      // Catppuccin: the mode toggle changes the resolved id AND matches no
      // Shiki bundle, so upstream never schedules its own async re-pass —
      // zero tokenize calls is a deterministic assertion (github/everforest
      // still see upstream's post-load markDirty pass; the splice-free
      // guarantee for those families is asserted in the toggle test above).
      await renderCodeHighlightPlugin(
        "light",
        () => {
          const code = $createCodeNode("ts");
          code.append($createTextNode(CODE_SNIPPET));
          $getRoot().append(code);
        },
        "catppuccin"
      );
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          resolve();
        });
      });
      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);

      // Spy on the tokenizer: a mode-only flip must converge through
      // `setTheme` and the wrapper color vars without a tokenize pass.
      const originalTokenize = TwinkleplopTokenizer.$tokenize;
      let tokenizeCalls = 0;
      const tokenizeSpy = function tokenizeSpy(
        this: Tokenizer,
        codeNode: CodeNode,
        language?: string
      ) {
        tokenizeCalls += 1;
        return originalTokenize.call(this, codeNode, language);
      };
      TwinkleplopTokenizer.$tokenize = tokenizeSpy;
      try {
        await rerenderWithTheme("dark", "catppuccin");
        strictEqual(
          await pollUntil(
            () =>
              readCodeNode(editorRef ?? (undefined as never))?.theme ===
              "catppuccin-dark"
          ),
          true
        );
        strictEqual(tokenizeCalls, 0);
      } finally {
        TwinkleplopTokenizer.$tokenize = originalTokenize;
      }
    } finally {
      pendingFrames.clear();
    }
  });

  test("family switches still run the full re-tokenize", async () => {
    try {
      await renderCodeHighlightPlugin(
        "light",
        () => {
          const code = $createCodeNode("ts");
          code.append($createTextNode(CODE_SNIPPET));
          $getRoot().append(code);
        },
        "github"
      );
      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          resolve();
        });
      });
      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);

      const originalTokenize = TwinkleplopTokenizer.$tokenize;
      let tokenizeCalls = 0;
      const tokenizeSpy = function tokenizeSpy(
        this: Tokenizer,
        codeNode: CodeNode,
        language?: string
      ) {
        tokenizeCalls += 1;
        return originalTokenize.call(this, codeNode, language);
      };
      TwinkleplopTokenizer.$tokenize = tokenizeSpy;
      try {
        await rerenderWithTheme("dark", "nord");
        strictEqual(
          await pollUntil(
            () =>
              readCodeNode(editorRef ?? (undefined as never))?.theme ===
              "nord-dark"
          ),
          true
        );
        ok(tokenizeCalls >= 1);
      } finally {
        TwinkleplopTokenizer.$tokenize = originalTokenize;
      }
    } finally {
      pendingFrames.clear();
    }
  });

  test("family switches tokenize once per pass, not once per token child", async () => {
    try {
      // A 40-line block: the flood this test locks out scales with the
      // token count, so a one-line snippet hides it (~a dozen calls) the
      // way the sibling test above does.
      const longSnippet = Array.from({ length: 40 }, (_, index) => {
        switch (index % 8) {
          case 0: {
            return 'import { useState, useEffect } from "react";';
          }
          case 1: {
            return "const cache = new Map<string, number>();";
          }
          case 2: {
            return "export function useThing(id: string): number {";
          }
          case 3: {
            return "  // derived value with a long explanatory comment";
          }
          case 4: {
            return "  const value = cache.get(id) ?? compute(id, { deep: true });";
          }
          case 5: {
            return "  useEffect(() => { cache.set(id, value); }, [id, value]);";
          }
          case 6: {
            return "  return value * 2;";
          }
          default: {
            return "}";
          }
        }
      }).join("\n");
      await renderCodeHighlightPlugin(
        "light",
        () => {
          const code = $createCodeNode("ts");
          code.append($createTextNode(longSnippet));
          $getRoot().append(code);
        },
        "github"
      );
      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);

      const originalTokenize = TwinkleplopTokenizer.$tokenize;
      let tokenizeCalls = 0;
      const tokenizeSpy = function tokenizeSpy(
        this: Tokenizer,
        codeNode: CodeNode,
        language?: string
      ) {
        tokenizeCalls += 1;
        return originalTokenize.call(this, codeNode, language);
      };
      TwinkleplopTokenizer.$tokenize = tokenizeSpy;
      try {
        await rerenderWithTheme("dark", "nord");
        strictEqual(
          await pollUntil(
            () =>
              readCodeNode(editorRef ?? (undefined as never))?.theme ===
              "nord-dark"
          ),
          true
        );
        // Let the post-splice convergence pass land before reading the
        // spy (the theme id flips in the splice pass itself).
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 100);
        });

        // Registering a transform dirty-marks every node of its type, and
        // every token IS a TextNode: without the re-entrancy guard the
        // sync hook re-tokenized the parent once per token child (~1,700
        // calls / ~700ms for this block). The guard keeps it at one
        // tokenize per pass: the splice pass plus the convergence pass.
        ok(tokenizeCalls >= 1);
        ok(tokenizeCalls <= 4);
      } finally {
        TwinkleplopTokenizer.$tokenize = originalTokenize;
      }
    } finally {
      pendingFrames.clear();
    }
  });
});

type ChromeThemeFamily = "github" | "catppuccin" | "nord" | "everforest";

let chromeControls: {
  family: ChromeThemeFamily;
  setFamily: (family: ChromeThemeFamily) => void;
} | null = null;

const ThemeProbe = () => {
  const theme = useCodeBlockTheme();
  useEffect(() => {
    if (theme) {
      chromeControls = theme;
    }
  }, [theme]);
  return null;
};

// Mounts the real composition surface with every optional behavior off,
// so the assertions below run against the production wiring (theme state,
// wrapper token, chrome overlay, highlighter) instead of a lookalike.
const renderChromeHarness = async () => {
  // Unmount any earlier harness so editors from previous tests cannot
  // interfere with anchor collection or theme reads.
  await act(() => {
    rootRef?.unmount();
  });
  rootRef = null;
  containerRef?.remove();

  containerRef = document.createElement("div");
  document.body.append(containerRef);
  rootRef = createRoot(containerRef);

  const config = createEditorConfig({
    editable: true,
    editorState: () => {
      const code = $createCodeNode("tsx");
      code.append($createTextNode(CODE_SNIPPET));
      $getRoot().append(code);
    },
    featureNodes: [],
  });

  const features = resolveEditorFeatures({
    exportMarkdown: false,
    floatingLinkEditor: false,
    floatingToolbar: false,
    focusOnMount: false,
    history: false,
    markdownShortcuts: false,
    slashCommand: false,
    snapshot: {
      emitInitialSnapshot: false,
      html: false,
      markdown: false,
      text: false,
    },
    tabIndentation: false,
  });

  await act(() => {
    rootRef?.render(
      createElement(
        ThemeContext.Provider,
        { value: themeContextValue("light") },
        createElement(
          LexicalComposer,
          { initialConfig: config },
          createElement(EditorContent, {
            codeBlockTheme: "github",
            commands: [],
            editable: true,
            extraFeatures: [],
            features,
            minimal: true,
            onSnapshotChange: () => {},
            placeholder: "Write something…",
            pluginSlots: {
              afterDefault: createElement(
                Fragment,
                null,
                createElement(EditorProbe),
                createElement(ThemeProbe)
              ),
            },
            showFooter: false,
            snapshot: { html: "", markdown: "", text: "" },
            toolbar: false,
            transformers: [],
          })
        )
      )
    );
  });
};

const queryChromeTrigger = (label: string): Element | null =>
  containerRef?.querySelector(`[aria-label="${label}"]`) ?? null;

const readCodeBlockBackground = (): string =>
  (containerRef?.querySelector(".group") as HTMLElement | null)?.style
    .getPropertyValue("--editor-code-bg")
    .trim() ?? "";

/**
 * Verifies every typed token was built from the node's current theme:
 * without the inline sync a family switch flips `CodeNode.theme` while the
 * token styles keep the previous font declarations (colors are var
 * references resolved by `EditorContent`'s wrapper vars, outside node
 * state). Bare gap nodes carry no highlight type and no style by design.
 */
const readCodeTokenAudit = (
  editor: LexicalEditor
): { mismatches: string[]; theme: string } | null =>
  editor.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      if ($isCodeNode(child)) {
        const theme = child.getTheme() ?? "";
        const mismatches: string[] = [];
        for (const token of child.getChildren()) {
          if ($isCodeHighlightNode(token)) {
            const highlightType = token.getHighlightType();
            if (highlightType === null || highlightType === undefined) {
              if (token.getStyle() !== "") {
                mismatches.push(
                  `${token.getTextContent()}:${token.getStyle()} is an unstyled gap node`
                );
              }
              continue;
            }
            const expected = getCodeBlockTokenStyle(theme, highlightType);
            if ((token.getStyle() ?? "") !== expected) {
              mismatches.push(
                `${token.getTextContent()}:${token.getStyle()}!==${expected}`
              );
            }
          }
        }
        return { mismatches, theme };
      }
    }
    return null;
  });

const readSelectionCodeParent = (editor: LexicalEditor, key: string): boolean =>
  editor.getEditorState().read(() => {
    const parent = $getNodeByKey(key)?.getParent();
    return parent !== null && parent !== undefined && $isCodeNode(parent);
  });

const pollForChromeRow = (): Promise<boolean> =>
  pollUntil(
    () =>
      (containerRef?.querySelectorAll("[data-code-chrome]").length ?? 0) === 1,
    240,
    10
  );

describe("CodeBlockChromePlugin", () => {
  test("renders a theme switch next to the language picker on every block", async () => {
    try {
      await renderChromeHarness();

      strictEqual(await pollForChromeRow(), true);
      const themeTrigger = queryChromeTrigger("Code block theme");
      const languageTrigger = queryChromeTrigger("Code block language");
      strictEqual(themeTrigger !== null, true);
      strictEqual(languageTrigger !== null, true);
      strictEqual(themeTrigger?.textContent?.includes("GitHub"), true);
      strictEqual(languageTrigger?.textContent?.includes("TSX"), true);
    } finally {
      pendingFrames.clear();
    }
  });

  test("switching the family re-tokenizes every block with the new theme", async () => {
    try {
      await renderChromeHarness();

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);
      strictEqual(readCodeNode(editorRef)?.theme, "github-light");
      // GitHub blocks sit on the shadcn card surface, not the upstream white.
      strictEqual(readCodeBlockBackground(), "var(--card, oklch(1 0 0))");

      await act(() => {
        chromeControls?.setFamily("nord");
      });

      const retokenized = await pollUntil(
        () => readCodeNode(editorRef as LexicalEditor)?.theme === "nord-dark"
      );
      strictEqual(retokenized, true);
      strictEqual(readCodeBlockBackground(), "#2e3440");
      // The switch itself is covered by the visibility test above; its
      // dropdown writes through the same context state flipped here.
      strictEqual(
        queryChromeTrigger("Code block theme") instanceof HTMLElement,
        true
      );
    } finally {
      pendingFrames.clear();
    }
  });

  test("switching the family repaints tokens with the caret inside the block", async () => {
    try {
      await renderChromeHarness();

      if (!editorRef) {
        throw new Error("editor reference missing");
      }
      if (!chromeControls) {
        throw new Error("theme controls missing");
      }

      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);

      // The theme picker keeps the caret via mousedown-preventDefault, so
      // family switches land with the selection inside the block. The
      // caret itself is not asserted here: other editors mounted in the
      // shared test document null out-of-owners selections through
      // Lexical's cross-editor `selectionchange` reconciliation, which
      // makes live-caret assertions across async polls flaky. Retention
      // is covered deterministically by the typing test below (single
      // synchronous update window).
      await act(() => {
        editorRef?.update(() => {
          for (const child of $getRoot().getChildren()) {
            if ($isCodeNode(child)) {
              const first = child.getFirstChild();
              if (first && $isTextNode(first)) {
                first.select(2, 2);
              }
            }
          }
        });
      });
      const githubHighlightTypes = readCodeHighlightTypes(
        editorRef as LexicalEditor
      );
      ok(githubHighlightTypes !== null);

      await act(() => {
        chromeControls?.setFamily("nord");
      });

      strictEqual(
        await pollUntil(
          () => readCodeNode(editorRef as LexicalEditor)?.theme === "nord-dark"
        ),
        true
      );
      // The family switch runs the full re-tokenize: Nord's resolver remaps
      // roles (e.g. `const`/constants to base text), so the highlight types
      // change even though the text is identical.
      notDeepStrictEqual(
        readCodeHighlightTypes(editorRef as LexicalEditor),
        githubHighlightTypes
      );
      // `nord-*` matches no Shiki theme bundle, so upstream's transform can
      // never re-tokenize it: without the inline sync the node theme flips
      // while every token keeps the GitHub colors.
      strictEqual(
        await pollUntil(() => {
          const audit = readCodeTokenAudit(editorRef as LexicalEditor);
          return audit !== null && audit.mismatches.length === 0;
        }),
        true
      );
    } finally {
      pendingFrames.clear();
    }
  });

  test("typing inside the block re-highlights with the caret retained", async () => {
    try {
      await renderChromeHarness();

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      await act(() => {
        fireFrames();
        fireFrames();
      });
      strictEqual(await pollForHighlightNodes(), true);

      await act(() => {
        editorRef?.update(() => {
          for (const child of $getRoot().getChildren()) {
            if ($isCodeNode(child)) {
              const first = child.getFirstChild();
              if (first && $isTextNode(first)) {
                first.select(4, 4);
              }
            }
          }
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText("X");
          }
        });
      });

      strictEqual(
        await pollUntil(() =>
          (editorRef as LexicalEditor).getEditorState().read(() => {
            for (const child of $getRoot().getChildren()) {
              if ($isCodeNode(child)) {
                return child.getTextContent() === "consXt answer = 42;";
              }
            }
            return false;
          })
        ),
        true
      );
      strictEqual(
        await pollUntil(() => {
          const audit = readCodeTokenAudit(editorRef as LexicalEditor);
          return audit !== null && audit.mismatches.length === 0;
        }),
        true
      );

      const anchor = readSelectionAnchor(editorRef as LexicalEditor);
      strictEqual(anchor?.offset, 5);
      strictEqual(
        readSelectionCodeParent(editorRef as LexicalEditor, anchor?.key ?? ""),
        true
      );
    } finally {
      pendingFrames.clear();
    }
  });
});
