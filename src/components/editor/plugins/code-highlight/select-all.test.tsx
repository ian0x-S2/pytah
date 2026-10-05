import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import type { LexicalEditor, RangeSelection } from "lexical";

// Headless editor test: no ContentEditable, no DOM selection sync — the
// select-all behavior is exercised through the same registration the React
// plugin mounts, without any browser surface.
const { $createCodeNode, $isCodeNode, CodeHighlightNode, CodeNode } =
  await import("@lexical/code");
const {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $selectAll,
  COMMAND_PRIORITY_EDITOR,
  createEditor,
  SELECT_ALL_COMMAND,
} = await import("lexical");
const { registerCodeSelectAll } = await import("./select-all");

const CODE_TEXT = "const x = 1;\nconst y = 2;";

const CODE_NODES = [CodeNode, CodeHighlightNode];

// Lexical schedules state commits in a microtask; reads must wait for it.
const flushCommit = (): Promise<void> =>
  new Promise((resolve) => {
    queueMicrotask(resolve);
  });

interface Seed {
  code: unknown;
  codeText: unknown;
  paragraphText: unknown;
}

const createHeadlessEditor = async (
  seed: (nodes: Seed) => void
): Promise<LexicalEditor> => {
  const editor = createEditor({
    editable: true,
    nodes: CODE_NODES,
    onError: (error: Error) => {
      throw error;
    },
  });
  editor.update(() => {
    const paragraph = $createParagraphNode();
    const paragraphText = $createTextNode("outside");
    paragraph.append(paragraphText);
    $getRoot().append(paragraph);
    const code = $createCodeNode("tsx");
    const codeText = $createTextNode(CODE_TEXT);
    code.append(codeText);
    $getRoot().append(code);
    seed({ code, codeText, paragraphText });
  });
  await flushCommit();
  return editor;
};

const dispatchSelectAll = async (editor: LexicalEditor): Promise<void> => {
  editor.dispatchCommand(
    SELECT_ALL_COMMAND,
    // Headless environment: no KeyboardEvent global; nothing on the
    // select-all path inspects the event payload.
    { ctrlKey: true, key: "a" } as unknown as KeyboardEvent
  );
  await flushCommit();
};

const readSelection = (
  editor: LexicalEditor,
  read: (selection: RangeSelection) => void
): void => {
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      throw new Error("expected a range selection");
    }
    read(selection);
  });
};

const $resolveCodeAncestor = (start: unknown): boolean => {
  let current: unknown = start;
  while (current !== null) {
    if ($isCodeNode(current as never)) {
      return true;
    }
    current = (current as { getParent?: () => unknown }).getParent?.() ?? null;
  }
  return false;
};

interface SeedNodes {
  select: (a: number, b?: number) => RangeSelection;
  getKey: () => string;
}

describe("registerCodeSelectAll", () => {
  test("select-all with the caret inside a code block stays inside it", async () => {
    const editor = await createHeadlessEditor(({ codeText }) => {
      (codeText as SeedNodes).select(3);
    });
    const unregister = registerCodeSelectAll(editor);

    await dispatchSelectAll(editor);

    readSelection(editor, (selection) => {
      // Both endpoints resolve inside the code block.
      strictEqual($resolveCodeAncestor(selection.anchor.getNode()), true);
      strictEqual($resolveCodeAncestor(selection.focus.getNode()), true);
      // Exactly the block's content, never the surrounding paragraph.
      strictEqual(selection.getTextContent(), CODE_TEXT);
    });
    unregister();
  });

  test("a selection crossing into a code block collapses into it", async () => {
    const editor = await createHeadlessEditor(({ codeText, paragraphText }) => {
      // Anchor in the paragraph, focus inside the code block.
      const selection = (paragraphText as SeedNodes).select(0, 7);
      selection.focus.set((codeText as SeedNodes).getKey(), 0, "text");
    });
    const unregister = registerCodeSelectAll(editor);

    await dispatchSelectAll(editor);

    readSelection(editor, (selection) => {
      strictEqual($resolveCodeAncestor(selection.anchor.getNode()), true);
      strictEqual($resolveCodeAncestor(selection.focus.getNode()), true);
      strictEqual(selection.getTextContent(), CODE_TEXT);
    });
    unregister();
  });

  test("select-all outside a code block still selects the whole document", async () => {
    const editor = await createHeadlessEditor(({ paragraphText }) => {
      (paragraphText as SeedNodes).select(3);
    });
    // Emulate the rich-text core's default handler (registered by the
    // RichTextPlugin in production, absent from a headless editor).
    const unregisterDefault = editor.registerCommand(
      SELECT_ALL_COMMAND,
      () => {
        $selectAll();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
    const unregister = registerCodeSelectAll(editor);

    await dispatchSelectAll(editor);

    readSelection(editor, (selection) => {
      const content = selection.getTextContent();
      strictEqual(content.includes("outside"), true);
      strictEqual(content.includes(CODE_TEXT), true);
    });
    unregisterDefault();
    unregister();
  });

  test("select-all on an empty code block collapses inside it", async () => {
    const editor = createEditor({
      editable: true,
      nodes: CODE_NODES,
      onError: (error: Error) => {
        throw error;
      },
    });
    editor.update(() => {
      const code = $createCodeNode("tsx");
      $getRoot().append(code);
      code.select(0, 0);
    });
    await flushCommit();
    const unregister = registerCodeSelectAll(editor);

    await dispatchSelectAll(editor);

    readSelection(editor, (selection) => {
      strictEqual($isCodeNode(selection.anchor.getNode()), true);
      strictEqual($isCodeNode(selection.focus.getNode()), true);
      deepStrictEqual(selection.getTextContent(), "");
    });
    unregister();
  });
});
