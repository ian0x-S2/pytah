import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { LexicalEditor } from "lexical";
import type { ReactNode } from "react";
import type { ResolvedEditorSnapshotOptions } from "../../core/composition";

// DOM globals must exist before React and Lexical evaluate their
// CAN_USE_DOM checks, so this file registers happy-dom up front and imports
// the browser-dependent modules dynamically afterwards. Type-only imports
// are erased and therefore safe to keep static.
GlobalRegistrator.register();
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { useLexicalComposerContext } = await import(
  "@lexical/react/LexicalComposerContext"
);
const { LexicalComposer } = await import("@lexical/react/LexicalComposer");
const { HISTORY_MERGE_TAG } = await import("lexical");
const {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} = await import("lexical");
const { DEFAULT_EDITOR_SNAPSHOT_OPTIONS } = await import(
  "../../core/composition"
);
const { EDITOR_SEED_UPDATE_TAG } = await import("../../core/constants");
const { createEditorConfig } = await import("../../core/config");
const { readEditorSnapshot } = await import("../../core/utils");
const { EditorStatePlugin, shouldEmitSnapshotUpdate } = await import(
  "./editor-state"
);

const INITIAL_CONFIG = createEditorConfig({
  editable: true,
  featureNodes: [],
});

const SEED_MARKDOWN = "# Seed heading\n\nSeed paragraph.";

interface SnapshotRecord {
  html: string;
  markdown: string;
  text: string;
}

interface Recorder {
  snapshots: SnapshotRecord[];
  texts: string[];
}

const createRecorder = (): Recorder => ({ snapshots: [], texts: [] });

let editorRef: LexicalEditor | null = null;

const EditorProbe = () => {
  const [editor] = useLexicalComposerContext();
  editorRef = editor;
  return null;
};

interface RenderOptions {
  initialMarkdown?: string;
  recorder?: Recorder;
  snapshotOptions?: ResolvedEditorSnapshotOptions;
}

const renderEditorStatePlugin = async ({
  initialMarkdown,
  recorder = createRecorder(),
  snapshotOptions = DEFAULT_EDITOR_SNAPSHOT_OPTIONS,
}: RenderOptions = {}) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  const renderWith = (markdown?: string) => {
    const children: ReactNode[] = [
      createElement(EditorProbe),
      createElement(EditorStatePlugin, {
        initialMarkdown: markdown,
        onChange: (textContent: string) => {
          recorder.texts.push(textContent);
        },
        onSnapshotReady: (snapshot: SnapshotRecord) => {
          recorder.snapshots.push(snapshot);
        },
        snapshotOptions,
      }),
    ];

    root.render(
      createElement(
        LexicalComposer,
        { initialConfig: INITIAL_CONFIG },
        ...children
      )
    );
  };

  await act(() => {
    renderWith(initialMarkdown);
  });

  return {
    async appendParagraph(text: string) {
      await act(() => {
        editorRef?.update(() => {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(text));
          $getRoot().append(paragraph);
        });
      });
    },
    container,
    recorder,
    async rerender(markdown?: string) {
      await act(() => {
        renderWith(markdown);
      });
    },
    async unmount() {
      await act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};

const flushUpdates = async () => {
  await new Promise<void>((resolve) => {
    queueMicrotask(() => {
      resolve();
    });
  });
};

const readAnchorSelection = (editor: LexicalEditor) => {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return null;
    }
    return { key: selection.anchor.key, offset: selection.anchor.offset };
  });
};

after(() => {
  GlobalRegistrator.unregister();
});

describe("shouldEmitSnapshotUpdate", () => {
  test("mirrors OnChangePlugin filtering plus seed suppression", async () => {
    const { createHeadlessEditor } = await import("@lexical/headless");
    const config = createEditorConfig({ editable: true, featureNodes: [] });
    const editor = createHeadlessEditor({
      editable: config.editable,
      namespace: config.namespace,
      nodes: config.nodes,
      onError: (error) => {
        throw error;
      },
      theme: config.theme,
    });

    const emptyState = editor.getEditorState();
    editor.update(() => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("content"));
      $getRoot().append(paragraph);
    });
    await flushUpdates();
    const nonEmptyState = editor.getEditorState();

    const dirty = {
      dirtyElements: new Map([["root", true]]),
      dirtyLeaves: new Map(),
    };
    const clean = { dirtyElements: new Map(), dirtyLeaves: new Map() };

    // Selection-only updates never change serialized content.
    strictEqual(
      shouldEmitSnapshotUpdate(
        { ...clean, prevEditorState: nonEmptyState, tags: new Set() },
        { emitInitialSnapshot: true }
      ),
      false
    );
    // History merge tags are ignored.
    strictEqual(
      shouldEmitSnapshotUpdate(
        {
          ...dirty,
          prevEditorState: nonEmptyState,
          tags: new Set([HISTORY_MERGE_TAG]),
        },
        { emitInitialSnapshot: true }
      ),
      false
    );
    // The initial empty state is ignored.
    strictEqual(
      shouldEmitSnapshotUpdate(
        { ...dirty, prevEditorState: emptyState, tags: new Set() },
        { emitInitialSnapshot: true }
      ),
      false
    );
    // Tagged seed updates are suppressed only when opted out.
    strictEqual(
      shouldEmitSnapshotUpdate(
        {
          ...dirty,
          prevEditorState: nonEmptyState,
          tags: new Set([EDITOR_SEED_UPDATE_TAG]),
        },
        { emitInitialSnapshot: false }
      ),
      false
    );
    strictEqual(
      shouldEmitSnapshotUpdate(
        {
          ...dirty,
          prevEditorState: nonEmptyState,
          tags: new Set([EDITOR_SEED_UPDATE_TAG]),
        },
        { emitInitialSnapshot: true }
      ),
      true
    );
    // Regular content updates always emit.
    strictEqual(
      shouldEmitSnapshotUpdate(
        { ...dirty, prevEditorState: nonEmptyState, tags: new Set() },
        { emitInitialSnapshot: false }
      ),
      true
    );
  });
});

describe("EditorStatePlugin", () => {
  test("emitInitialSnapshot: false suppresses the seed; the first real edit emits", async () => {
    const render = await renderEditorStatePlugin({
      initialMarkdown: SEED_MARKDOWN,
      snapshotOptions: {
        emitInitialSnapshot: false,
        html: false,
        markdown: true,
        text: true,
      },
    });

    try {
      strictEqual(render.recorder.texts.length, 0);
      strictEqual(render.recorder.snapshots.length, 0);

      await render.appendParagraph("hello");

      deepStrictEqual(render.recorder.texts, [
        "Seed heading\n\nSeed paragraph.\n\nhello",
      ]);
      strictEqual(render.recorder.snapshots.length, 1);
      strictEqual(
        render.recorder.snapshots[0].markdown,
        "# Seed heading\n\nSeed paragraph.\n\nhello"
      );
      strictEqual(render.recorder.snapshots[0].html, "");
      strictEqual(render.recorder.snapshots[0].text.includes("hello"), true);
    } finally {
      await render.unmount();
    }
  });

  test("text: false skips the text callback and emits an empty text field", async () => {
    const render = await renderEditorStatePlugin({
      initialMarkdown: SEED_MARKDOWN,
      snapshotOptions: {
        emitInitialSnapshot: false,
        html: true,
        markdown: true,
        text: false,
      },
    });

    try {
      await render.appendParagraph("hello");

      deepStrictEqual(render.recorder.texts, []);
      strictEqual(render.recorder.snapshots.length, 1);
      strictEqual(render.recorder.snapshots[0].text, "");
      strictEqual(
        render.recorder.snapshots[0].markdown,
        "# Seed heading\n\nSeed paragraph.\n\nhello"
      );
      strictEqual(render.recorder.snapshots[0].html.includes("<p"), true);
    } finally {
      await render.unmount();
    }
  });

  test("defaults serialize html, markdown and text per change", async () => {
    const render = await renderEditorStatePlugin({
      initialMarkdown: SEED_MARKDOWN,
    });

    try {
      await render.appendParagraph("hello");

      strictEqual(render.recorder.snapshots.length, 1);
      strictEqual(render.recorder.snapshots[0].html.includes("<p"), true);
      strictEqual(
        render.recorder.snapshots[0].markdown,
        "# Seed heading\n\nSeed paragraph.\n\nhello"
      );
      strictEqual(render.recorder.snapshots[0].text.includes("hello"), true);
      strictEqual(render.recorder.texts.length, 1);
    } finally {
      await render.unmount();
    }
  });

  test("seed once per mount: new initialMarkdown identity does not replace state or reset the caret", async () => {
    const render = await renderEditorStatePlugin({
      initialMarkdown: SEED_MARKDOWN,
    });

    try {
      // Place the caret at the end of the seeded content and remember it.
      await act(() => {
        editorRef?.update(() => {
          $getRoot().selectEnd();
        });
      });
      await flushUpdates();

      const selectionBefore = editorRef ? readAnchorSelection(editorRef) : null;
      strictEqual(selectionBefore !== null, true);

      await render.rerender("# Replaced seed");

      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      const snapshot = readEditorSnapshot(editorRef, undefined, {
        html: false,
        markdown: true,
        text: false,
      });
      strictEqual(snapshot.markdown, SEED_MARKDOWN);
      deepStrictEqual(readAnchorSelection(editorRef), selectionBefore);
    } finally {
      await render.unmount();
    }
  });
});
