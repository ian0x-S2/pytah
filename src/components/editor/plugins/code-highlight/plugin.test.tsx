import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";
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

      const anchorAfterToggle = readSelectionAnchor(editorRef);
      deepStrictEqual(anchorAfterToggle, anchorBefore);
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
 * Verifies every token was built from the node's current theme: without the
 * inline sync a family/mode switch flips `CodeNode.theme` while the token
 * inline styles keep the previous palette.
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
            const expected = getCodeBlockTokenStyle(
              theme,
              token.getHighlightType() ?? ""
            );
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
      // The block background follows the palette, not the muted token.
      strictEqual(readCodeBlockBackground(), "#ffffff");

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

      await act(() => {
        chromeControls?.setFamily("nord");
      });

      strictEqual(
        await pollUntil(
          () => readCodeNode(editorRef as LexicalEditor)?.theme === "nord-dark"
        ),
        true
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
