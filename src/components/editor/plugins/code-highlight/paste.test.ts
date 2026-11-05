import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import type { LexicalEditor } from "lexical";

// Headless editor test: exercises the same registration the code-block
// feature mounts, without a ContentEditable or a real clipboard.
const { $createCodeNode, $isCodeNode, CodeHighlightNode, CodeNode } =
  await import("@lexical/code");
const {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createEditor,
  PASTE_COMMAND,
  SELECT_ALL_COMMAND,
} = await import("lexical");
const { registerCodePaste } = await import("./paste");
const { registerCodeSelectAll } = await import("./select-all");

const CODE_TEXT = "const x = 1;\n\nconst y = 2;";
const CODE_NODES = [CodeNode, CodeHighlightNode];

interface FakeDataTransfer {
  files: object[];
  getData: (type: string) => string;
}

class ClipboardEvent {
  clipboardData: FakeDataTransfer;
  defaultPrevented = false;

  constructor(dataTransfer: FakeDataTransfer) {
    this.clipboardData = dataTransfer;
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

type DomClipboardEvent = InstanceType<typeof globalThis.ClipboardEvent>;

// `objectKlassEquals` compares constructor names, so the test double must be
// reachable as the global `ClipboardEvent` the handler checks against.
(globalThis as Record<string, unknown>).ClipboardEvent = ClipboardEvent;

const flushCommit = (): Promise<void> =>
  new Promise((resolve) => {
    queueMicrotask(resolve);
  });

const createHeadlessEditor = async (): Promise<LexicalEditor> => {
  const editor = createEditor({
    editable: true,
    nodes: CODE_NODES,
    onError: (error: Error) => {
      throw error;
    },
  });
  editor.update(() => {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode("outside"));
    $getRoot().append(paragraph);

    const code = $createCodeNode("tsx");
    code.append($createTextNode(CODE_TEXT));
    $getRoot().append(code);
  });
  await flushCommit();
  return editor;
};

const selectCode = async (editor: LexicalEditor): Promise<void> => {
  editor.update(() => {
    const code = $getRoot().getLastChild();
    if (!$isCodeNode(code)) {
      throw new Error("expected a code node");
    }
    code.select(0, code.getChildrenSize());
  });
  await flushCommit();
};

const paste = async (
  editor: LexicalEditor,
  data: { files?: object[]; html?: string; text?: string }
): Promise<ClipboardEvent> => {
  const event = new ClipboardEvent({
    files: data.files ?? [],
    getData: (type: string) => {
      if (type === "text/plain") {
        return data.text ?? "";
      }
      if (type === "text/html") {
        return data.html ?? "";
      }
      return "";
    },
  });
  editor.dispatchCommand(PASTE_COMMAND, event as unknown as DomClipboardEvent);
  await flushCommit();
  return event;
};

const readCodeText = (editor: LexicalEditor, key: string): string =>
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(key);
    if (!$isCodeNode(node)) {
      throw new Error("expected a code node");
    }
    return node.getTextContent();
  });

const readCodeKey = (editor: LexicalEditor): string =>
  editor.getEditorState().read(() => {
    const node = $getRoot().getLastChild();
    if (!$isCodeNode(node)) {
      throw new Error("expected a code node");
    }
    return node.getKey();
  });

describe("registerCodePaste", () => {
  test("replaces a full code-block selection with the clipboard text", async () => {
    const editor = await createHeadlessEditor();
    const key = readCodeKey(editor);
    const unregister = registerCodePaste(editor);
    const unregisterSelectAll = registerCodeSelectAll(editor);

    editor.update(() => {
      const code = $getRoot().getLastChild();
      if (!$isCodeNode(code)) {
        throw new Error("expected a code node");
      }
      const first = code.getFirstChild();
      if (!$isTextNode(first)) {
        throw new Error("expected a text node");
      }
      first.select(0, 0);
    });
    await flushCommit();

    editor.dispatchCommand(SELECT_ALL_COMMAND, {
      ctrlKey: true,
      key: "a",
    } as unknown as KeyboardEvent);
    await flushCommit();

    const event = await paste(editor, { text: "const z = 3;" });

    strictEqual(event.defaultPrevented, true);
    strictEqual(readCodeText(editor, key), "const z = 3;");
    unregisterSelectAll();
    unregister();
  });

  test("inserts multiline clipboard text as code line breaks", async () => {
    const editor = await createHeadlessEditor();
    const key = readCodeKey(editor);
    const unregister = registerCodePaste(editor);
    await selectCode(editor);

    await paste(editor, { text: "one\ntwo\n\tthree" });

    strictEqual(readCodeText(editor, key), "one\ntwo\n\tthree");
    unregister();
  });

  test("ignores rich HTML markup and pastes the plain-text flavor", async () => {
    const editor = await createHeadlessEditor();
    const key = readCodeKey(editor);
    const unregister = registerCodePaste(editor);
    await selectCode(editor);

    await paste(editor, {
      html: '<div><span style="color:red">const</span> x = 1;<br><span>const</span> y = 2;</div>',
      text: "const x = 1;\nconst y = 2;",
    });

    strictEqual(readCodeText(editor, key), "const x = 1;\nconst y = 2;");
    unregister();
  });

  test("falls through for selections outside code blocks", async () => {
    const editor = await createHeadlessEditor();
    const unregister = registerCodePaste(editor);

    editor.update(() => {
      const paragraph = $getRoot().getFirstChild();
      if ($isElementNode(paragraph)) {
        paragraph.select(0, 0);
      }
    });
    await flushCommit();

    const event = await paste(editor, { text: "not code" });

    strictEqual(event.defaultPrevented, false);
    unregister();
  });

  test("falls through for file pastes so the image feature can handle them", async () => {
    const editor = await createHeadlessEditor();
    const unregister = registerCodePaste(editor);
    await selectCode(editor);

    const event = await paste(editor, {
      files: [{}],
      text: "ignored",
    });

    strictEqual(event.defaultPrevented, false);
    unregister();
  });

  test("empty clipboards fall through to the default paste handling", async () => {
    const editor = await createHeadlessEditor();
    const unregister = registerCodePaste(editor);
    await selectCode(editor);

    const event = await paste(editor, {});

    strictEqual(event.defaultPrevented, false);
    unregister();
  });

  test("leaves the document-wide paste untouched", async () => {
    const editor = await createHeadlessEditor();
    const unregister = registerCodePaste(editor);
    const unregisterDefault = editor.registerCommand(
      PASTE_COMMAND,
      () => true,
      COMMAND_PRIORITY_EDITOR
    );

    editor.update(() => {
      $getRoot().select(0, $getRoot().getChildrenSize());
    });
    await flushCommit();

    const event = await paste(editor, { text: "outside" });

    strictEqual(event.defaultPrevented, false);
    unregisterDefault();
    unregister();
  });
});
