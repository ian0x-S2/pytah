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

const { act, createElement, useEffect } = await import("react");
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
const { computeEditorTransformers } = await import("../../core/features");
const { $convertFromMarkdownString } = await import("@lexical/markdown");
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

let postMountContentUpdates = 0;
let postMountUpdateStates: unknown[] = [];

/**
 * Registers an update listener at mount time — after the composer's first
 * render — so any content update committed post-mount is counted and its
 * editor state recorded.
 */
const SeedUpdateProbe = () => {
  const [editor] = useLexicalComposerContext();
  editorRef = editor;

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return;
        }
        postMountContentUpdates += 1;
        postMountUpdateStates.push(editorState);
      }
    );
  }, [editor]);

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

interface ConfigSeededRenderOptions {
  emitInitialSnapshot: boolean;
  recorder?: Recorder;
}

/**
 * Renders EditorStatePlugin the way `Editor` does when content was seeded
 * through the composer's `initialConfig.editorState` function form.
 */
const renderConfigSeededPlugin = async ({
  emitInitialSnapshot,
  recorder = createRecorder(),
}: ConfigSeededRenderOptions) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  const transformers = computeEditorTransformers();
  const config = createEditorConfig({
    editable: true,
    featureNodes: [],
    // Runs inside the composer's first update, before any plugin mounts.
    editorState: () => {
      $getRoot().clear();
      $convertFromMarkdownString(SEED_MARKDOWN, [...transformers]);
    },
  });

  await act(() => {
    root.render(
      createElement(
        LexicalComposer,
        { initialConfig: config },
        createElement(SeedUpdateProbe),
        createElement(EditorStatePlugin, {
          initialMarkdown: SEED_MARKDOWN,
          onChange: (textContent: string) => {
            recorder.texts.push(textContent);
          },
          onSnapshotReady: (snapshot: SnapshotRecord) => {
            recorder.snapshots.push(snapshot);
          },
          seededViaConfig: true,
          snapshotOptions: {
            ...DEFAULT_EDITOR_SNAPSHOT_OPTIONS,
            emitInitialSnapshot,
          },
        })
      )
    );
  });

  return {
    container,
    recorder,
    async unmount() {
      await act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
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

describe("EditorStatePlugin (seeded via composer initial state)", () => {
  test("content exists in the first committed state and no second update occurs", async () => {
    postMountContentUpdates = 0;
    postMountUpdateStates = [];
    const render = await renderConfigSeededPlugin({
      emitInitialSnapshot: false,
    });

    try {
      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      // Drain the composer's initial update commit (scheduleMicroTask).
      await flushUpdates();

      // Exactly one content update is observed post-mount — the composer's
      // own init commit — and it already carries the full document. A
      // post-mount seeding effect would produce a second content update.
      strictEqual(postMountContentUpdates, 1);
      const firstUpdateHasHeading = (
        postMountUpdateStates[0] as import("lexical").EditorState
      ).read(() => {
        const first = $getRoot().getFirstChild();
        return first !== null && first.getType() === "heading";
      });
      strictEqual(firstUpdateHasHeading, true);

      const hasHeading = editorRef.getEditorState().read(() => {
        const first = $getRoot().getFirstChild();
        return first !== null && first.getType() === "heading";
      });
      strictEqual(hasHeading, true);

      // No further updates may be committed after that first one.
      const stateAfterSeed = editorRef.getEditorState();
      await flushUpdates();
      strictEqual(editorRef.getEditorState(), stateAfterSeed);
    } finally {
      await render.unmount();
    }
  });

  test("emitInitialSnapshot parity: emitted once from the seeded state when enabled, never when disabled", async () => {
    const emitted = await renderConfigSeededPlugin({
      emitInitialSnapshot: true,
    });

    try {
      if (!editorRef) {
        throw new Error("editor reference missing");
      }

      await flushUpdates();

      strictEqual(emitted.recorder.texts.length, 1);
      strictEqual(emitted.recorder.snapshots.length, 1);
      strictEqual(
        emitted.recorder.snapshots[0].markdown,
        "# Seed heading\n\nSeed paragraph."
      );
      strictEqual(emitted.recorder.texts[0].includes("Seed heading"), true);
    } finally {
      await emitted.unmount();
    }
  });
});
