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
const { $createTextNode, $getRoot } = await import("lexical");
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

const THEME_CONTEXT_VALUE = {
  resolvedTheme: "light" as const,
  setTheme: () => undefined,
  theme: "light" as const,
};

let editorRef: LexicalEditor | null = null;

const EditorProbe = () => {
  const [editor] = useLexicalComposerContext();
  editorRef = editor;
  return null;
};

const renderCodeHighlightPlugin = async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  const config = createEditorConfig({
    editable: true,
    featureNodes: [],
    editorState: () => {
      const code = $createCodeNode("ts");
      code.append($createTextNode(CODE_SNIPPET));
      $getRoot().append(code);
    },
  });

  await act(() => {
    root.render(
      createElement(
        ThemeContext.Provider,
        { value: THEME_CONTEXT_VALUE },
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

const flushUpdates = async () => {
  await new Promise<void>((resolve) => {
    queueMicrotask(() => {
      resolve();
    });
  });
};

const readCodeNode = (editor: LexicalEditor) => {
  return editor.getEditorState().read(() => {
    const first = $getRoot().getFirstChild();
    if (!(first && $isCodeNode(first))) {
      return null;
    }
    return {
      childTypes: first
        .getChildren()
        .map((child: LexicalNode) => child.getType()),
      theme: first.getTheme(),
    };
  });
};

const pollForHighlightNodes = async (): Promise<boolean> => {
  for (let attempt = 0; attempt < 240; attempt++) {
    const snapshot = editorRef ? readCodeNode(editorRef) : null;
    if (
      snapshot?.childTypes.some((type) => type === CodeHighlightNode.getType())
    ) {
      return true;
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 25);
    });
  }
  return false;
};

describe("CodeHighlightPlugin arming", () => {
  test("mount paints plain code first; highlighting arms after the arm frames", async () => {
    try {
      await renderCodeHighlightPlugin();
      await flushUpdates();

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      // Before the arm frames fire, the code block is plain text: no
      // CodeHighlightNodes and the themed retheme update has not run.
      const beforeArm = readCodeNode(editorRef);
      deepStrictEqual(beforeArm?.childTypes, ["text"]);
      strictEqual(beforeArm?.theme !== "github-light", true);

      // Fire the double-rAF arm; the arming effect then registers Shiki
      // highlighting and applies the theme.
      await act(() => {
        fireFrames();
        fireFrames();
      });

      const afterArm = readCodeNode(editorRef);
      strictEqual(afterArm?.theme, "github-light");

      // Shiki tokenization is async; wait for the CodeHighlightNodes.
      const highlighted = await pollForHighlightNodes();
      strictEqual(highlighted, true);
    } finally {
      pendingFrames.clear();
    }
  });

  test("highlighting stays unarmed when the arm frames never fire", async () => {
    try {
      await renderCodeHighlightPlugin();
      await flushUpdates();

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
});
