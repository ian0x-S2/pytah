import { strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof window === "undefined") {
  GlobalRegistrator.register();
}

after(() => {
  if (typeof window !== "undefined") {
    GlobalRegistrator.unregister();
  }
});

const {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  ParagraphNode,
  TextNode,
  createEditor,
} = await import("lexical");
const { $isLinkNode, $toggleLink, LinkNode, TOGGLE_LINK_COMMAND } =
  await import("@lexical/link");

const { handleLinkPaste } = await import("./paste");

const createTestEditor = () => {
  const editor = createEditor({
    nodes: [LinkNode, ParagraphNode, TextNode],
  });

  editor.registerCommand(
    TOGGLE_LINK_COMMAND,
    (payload) => {
      $toggleLink(payload);
      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );

  return editor;
};

const createFakePasteEvent = (options: {
  files?: File[];
  text?: string;
}): ClipboardEvent & { prevented: boolean } => {
  let prevented = false;
  return {
    clipboardData: {
      files: options.files ?? [],
      getData: (format: string) => {
        if (format === "text/plain") {
          return options.text ?? "";
        }
        return "";
      },
    },
    preventDefault: () => {
      prevented = true;
    },
    get prevented(): boolean {
      return prevented;
    },
  } as unknown as ClipboardEvent & { prevented: boolean };
};

const flushUpdates = async () => {
  await new Promise<void>((resolve) => {
    queueMicrotask(() => {
      resolve();
    });
  });
};

describe("handleLinkPaste", () => {
  test("returns false when files are present in clipboard", () => {
    const editor = createTestEditor();
    const fakeFile = new File(["dummy"], "test.png", { type: "image/png" });
    const event = createFakePasteEvent({
      files: [fakeFile],
      text: "https://example.com",
    });

    const handled = handleLinkPaste(editor, event);
    strictEqual(handled, false);
    strictEqual(event.prevented, false);
  });

  test("returns false when clipboard text is empty or invalid url", () => {
    const editor = createTestEditor();
    const event1 = createFakePasteEvent({ text: "" });
    strictEqual(handleLinkPaste(editor, event1), false);

    const event2 = createFakePasteEvent({ text: "just plain text" });
    strictEqual(handleLinkPaste(editor, event2), false);

    const event3 = createFakePasteEvent({ text: "https://" });
    strictEqual(handleLinkPaste(editor, event3), false);
  });

  test("returns false when clipboard text contains newlines", () => {
    const editor = createTestEditor();
    const event = createFakePasteEvent({
      text: "https://example.com\nhttps://other.com",
    });
    strictEqual(handleLinkPaste(editor, event), false);
  });

  test("returns false when selection is collapsed (caret only)", async () => {
    const editor = createTestEditor();
    await editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode("Some text");
        paragraph.append(textNode);
        root.append(paragraph);
        // Place caret at offset 0 (collapsed)
        textNode.select(0, 0);
      },
      { discrete: true }
    );

    const event = createFakePasteEvent({ text: "https://example.com" });
    const handled = handleLinkPaste(editor, event);
    strictEqual(handled, false);
    strictEqual(event.prevented, false);
  });

  test("inserts link and triggers onShowPasteMenu when selection is collapsed", async () => {
    const editor = createTestEditor();
    await editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        paragraph.select();
      },
      { discrete: true }
    );

    let menuCalled = false;
    let menuUrl = "";
    const event = createFakePasteEvent({ text: "https://example.com/demo" });
    const handled = handleLinkPaste(editor, event, {
      onShowPasteMenu: (payload) => {
        menuCalled = true;
        menuUrl = payload.url;
      },
    });

    strictEqual(handled, true);
    strictEqual(event.prevented, true);
    await flushUpdates();

    strictEqual(menuCalled, true);
    strictEqual(menuUrl, "https://example.com/demo");

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      strictEqual($isElementNode(paragraph), true);
      if ($isElementNode(paragraph)) {
        const link = paragraph.getChildren().find($isLinkNode);
        strictEqual(link !== undefined, true);
        strictEqual(link?.getURL(), "https://example.com/demo");
      }
    });
  });

  test("wraps highlighted text into a link when pasting a valid URL", async () => {
    const editor = createTestEditor();
    await editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode("Click here for info");
        paragraph.append(textNode);
        root.append(paragraph);
        // Select "here" (indices 6 to 10)
        textNode.select(6, 10);
      },
      { discrete: true }
    );

    const event = createFakePasteEvent({ text: "https://example.com/target" });
    const handled = handleLinkPaste(editor, event);

    strictEqual(handled, true);
    strictEqual(event.prevented, true);
    await flushUpdates();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      strictEqual($isElementNode(paragraph), true);

      // Paragraph should have children: "Click ", LinkNode("here"), " for info"
      const children = $isElementNode(paragraph) ? paragraph.getChildren() : [];
      const linkChild = children.find($isLinkNode);
      strictEqual(linkChild !== undefined, true);
      strictEqual(linkChild?.getURL(), "https://example.com/target");
      strictEqual(linkChild?.getTextContent(), "here");
    });
  });

  test("normalizes www. URL when pasting over selected text", async () => {
    const editor = createTestEditor();
    await editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode("Documentation");
        paragraph.append(textNode);
        root.append(paragraph);
        textNode.select(0, 13);
      },
      { discrete: true }
    );

    const event = createFakePasteEvent({ text: "www.google.com" });
    const handled = handleLinkPaste(editor, event);

    strictEqual(handled, true);
    strictEqual(event.prevented, true);
    await flushUpdates();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      strictEqual($isElementNode(paragraph), true);

      const children = $isElementNode(paragraph) ? paragraph.getChildren() : [];
      const linkChild = children.find($isLinkNode);
      strictEqual(linkChild !== undefined, true);
      strictEqual(linkChild?.getURL(), "https://www.google.com");
      strictEqual(linkChild?.getTextContent(), "Documentation");
    });
  });
});
