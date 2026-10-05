import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";

import { createHeadlessEditor } from "@lexical/headless";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";
import type { LexicalEditor } from "lexical";

import { createEditorConfig } from "../../core/config";
import {
  $isExcalidrawNode,
  ExcalidrawNode,
} from "../../core/nodes/excalidraw/node";
import { handleExcalidrawPaste } from "./paste";
import { parseExcalidrawClipboard } from "./scene";

const ELEMENT = { id: "el-1", isDeleted: false, type: "rectangle" };

const CLIPBOARD_JSON = JSON.stringify({
  elements: [ELEMENT],
  files: {},
  type: "excalidraw/clipboard",
});

const createTestEditor = (): LexicalEditor => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [ExcalidrawNode],
  });
  return createHeadlessEditor({
    editable: config.editable,
    namespace: config.namespace,
    nodes: config.nodes,
    onError: (error) => {
      throw error;
    },
    theme: config.theme,
  });
};

const fakePasteEvent = (text: string) => {
  let prevented = false;
  return {
    clipboardData: { getData: () => text },
    preventDefault: () => {
      prevented = true;
    },
    get prevented(): boolean {
      return prevented;
    },
  } as unknown as ClipboardEvent & { prevented: boolean };
};

/** Mirrors the plugin's registration so the paste path runs through Lexical's
 * command dispatch (which provides the active editor state, like a real
 * paste event does). */
const registerPasteHandler = (editor: LexicalEditor): void => {
  editor.registerCommand(
    PASTE_COMMAND,
    (event: ClipboardEvent | null) => {
      if (!event) {
        return false;
      }
      return handleExcalidrawPaste(editor, event);
    },
    COMMAND_PRIORITY_HIGH
  );
};

const dispatchPaste = async (
  editor: LexicalEditor,
  text: string
): Promise<{
  event: ClipboardEvent & { prevented: boolean };
  handled: boolean;
}> => {
  const event = fakePasteEvent(text);
  let handled = false;
  // Lexical dispatches paste commands from inside an update (active editor
  // state); mirror that here.
  await editor.update(() => {
    handled = editor.dispatchCommand(
      PASTE_COMMAND,
      event as unknown as ClipboardEvent
    );
  });
  return { event, handled };
};

const seedSelection = async (editor: LexicalEditor, text: string) => {
  await editor.update(() => {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(text));
    $getRoot().append(paragraph);
    paragraph.select();
  });
};

describe("parseExcalidrawClipboard", () => {
  test("recognizes an excalidraw clipboard payload", () => {
    const scene = parseExcalidrawClipboard(CLIPBOARD_JSON);
    strictEqual(scene !== null, true);
    strictEqual(scene?.elements.length, 1);
    strictEqual(scene?.elements[0]?.id, "el-1");
  });

  test("rejects regular text, JSON and empty payloads", () => {
    strictEqual(parseExcalidrawClipboard("just some text"), null);
    strictEqual(parseExcalidrawClipboard('{"elements":[]}'), null);
    strictEqual(
      parseExcalidrawClipboard(
        JSON.stringify({ elements: [], type: "excalidraw/clipboard" })
      ),
      null
    );
    strictEqual(parseExcalidrawClipboard('{"type":"other"}'), null);
    strictEqual(parseExcalidrawClipboard(""), null);
  });
});

describe("handleExcalidrawPaste", () => {
  test("inserts a drawing block and consumes the paste", async () => {
    const editor = createTestEditor();
    registerPasteHandler(editor);
    await seedSelection(editor, "");

    const { event, handled } = await dispatchPaste(editor, CLIPBOARD_JSON);
    strictEqual(handled, true);
    strictEqual(event.prevented, true);

    editor.getEditorState().read(() => {
      const drawing = $getRoot()
        .getChildren()
        .find((child) => $isExcalidrawNode(child));
      strictEqual($isExcalidrawNode(drawing), true);
      if ($isExcalidrawNode(drawing)) {
        const scene = JSON.parse(drawing.getData()) as {
          elements: { id: string }[];
        };
        strictEqual(scene.elements[0]?.id, "el-1");
      }
    });
  });

  test("lets regular pastes fall through untouched", async () => {
    const editor = createTestEditor();
    registerPasteHandler(editor);
    await seedSelection(editor, "hello");

    const { event, handled } = await dispatchPaste(editor, "plain pasted text");
    strictEqual(handled, false);
    strictEqual(event.prevented, false);

    editor.getEditorState().read(() => {
      strictEqual($getRoot().getTextContent(), "hello");
      strictEqual($isExcalidrawNode($getRoot().getFirstChild()), false);
    });
  });

  test("ignores pastes without a range selection", async () => {
    const editor = createTestEditor();
    registerPasteHandler(editor);

    const { event, handled } = await dispatchPaste(editor, CLIPBOARD_JSON);
    strictEqual(handled, false);
    strictEqual(event.prevented, false);
    editor.getEditorState().read(() => {
      strictEqual($isExcalidrawNode($getRoot().getFirstChild()), false);
    });
  });
});
