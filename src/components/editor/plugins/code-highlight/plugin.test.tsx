import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { LexicalEditor, LexicalNode } from "lexical";

// DOM globals must exist before React and Lexical evaluate their
// CAN_USE_DOM checks, so this file registers happy-dom up front and imports
// the browser-dependent modules dynamically afterwards.
GlobalRegistrator.register();
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { useLexicalComposerContext } = await import(
  "@lexical/react/LexicalComposerContext"
);
const { LexicalComposer } = await import("@lexical/react/LexicalComposer");
const { $createCodeNode, $isCodeNode, CodeHighlightNode } = await import(
  "@lexical/code"
);
const {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
} = await import("lexical");
const { createEditorConfig } = await import("../../core/config");
const { ThemeContext } = await import("@/components/theme-context");
const { CodeHighlightPlugin } = await import("./plugin");

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
  setTheme: () => undefined,
  theme: resolvedTheme,
});

let editorRef: LexicalEditor | null = null;
let rootRef: ReturnType<typeof createRoot> | null = null;
let containerRef: HTMLElement | null = null;

const EditorProbe = () => {
  const [editor] = useLexicalComposerContext();
  editorRef = editor;
  return null;
};

const renderCodeHighlightPlugin = async (
  resolvedTheme: "light" | "dark",
  seed?: () => void
) => {
  containerRef = document.createElement("div");
  document.body.append(containerRef);
  rootRef = createRoot(containerRef);

  const config = createEditorConfig({
    editable: true,
    featureNodes: [],
    editorState:
      seed ??
      (() => {
        const code = $createCodeNode("ts");
        code.append($createTextNode(CODE_SNIPPET));
        $getRoot().append(code);
      }),
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
          createElement(CodeHighlightPlugin)
        )
      )
    );
  });
};

// Re-renders with a different resolved theme, as the theme toggle does.
const rerenderWithTheme = async (resolvedTheme: "light" | "dark") => {
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
          createElement(CodeHighlightPlugin)
        )
      )
    );
  });
};

const readCodeNode = (editor: LexicalEditor) => {
  return editor.getEditorState().read(() => {
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
};

const pollUntil = async (
  read: () => boolean,
  attempts = 240,
  delayMs = 25
): Promise<boolean> => {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (read()) {
      return true;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
  return false;
};

const pollForHighlightNodes = (): Promise<boolean> => {
  return pollUntil(() => {
    const snapshot = editorRef ? readCodeNode(editorRef) : null;
    return (
      snapshot?.childTypes.some(
        (type) => type === CodeHighlightNode.getType()
      ) ?? false
    );
  });
};

const readSelectionAnchor = (
  editor: LexicalEditor
): { key: string; offset: number; type: string } | null => {
  return editor.getEditorState().read(() => {
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
};

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
      strictEqual(beforeArm?.theme !== "github-light", true);

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
      strictEqual(afterArm?.theme, "github-light");
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
      for (let attempt = 0; attempt < 6; attempt++) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 25);
        });
      }

      const beforeArm = readCodeNode(editorRef);
      deepStrictEqual(beforeArm?.childTypes, ["text"]);
      strictEqual(beforeArm?.theme !== "github-light", true);
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
      await rerenderWithTheme("dark");

      const toggled = await pollUntil(() => {
        return (
          readCodeNode(editorRef ?? (undefined as never))?.theme ===
          "github-dark"
        );
      });
      strictEqual(toggled, true);
      strictEqual(await pollForHighlightNodes(), true);

      const anchorAfterToggle = readSelectionAnchor(editorRef);
      deepStrictEqual(anchorAfterToggle, anchorBefore);
    } finally {
      pendingFrames.clear();
    }
  });
});
