import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// DOM globals must exist before Lexical evaluates its CAN_USE_DOM checks,
// so happy-dom registers up front and the editor modules load dynamically.
// The registration is released afterwards so sibling test files can manage
// their own DOM globals.
GlobalRegistrator.register();
after(() => {
  GlobalRegistrator.unregister();
});

const {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  createEditor,
} = await import("lexical");
const { ParagraphNode, $createTextNode, TextNode } = await import("lexical");
const { COMMAND_PRIORITY_EDITOR } = await import("lexical");
const { $toggleLink, TOGGLE_LINK_COMMAND } = await import("@lexical/link");
const { $createLinkNode, $isLinkNode, LinkNode } =
  await import("@lexical/link");
const { AutoLinkNode } = await import("@lexical/link");
const { applyToolbarLink } = await import("../floating-toolbar/actions");

const createTestEditor = () => {
  const editor = createEditor({
    nodes: [LinkNode, AutoLinkNode, ParagraphNode, TextNode],
  });
  // The app mounts @lexical/react's LinkPlugin (always-on) to handle
  // TOGGLE_LINK_COMMAND; the bare editor needs the same handler wired
  // for the toggle step of applyToolbarLink to work.
  void editor.registerCommand(
    TOGGLE_LINK_COMMAND,
    (payload) => {
      $toggleLink(payload);
      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );
  return editor;
};

const seedLink = async (
  editor: Awaited<ReturnType<typeof createTestEditor>>,
  text: string
) => {
  let linkKey = "";
  await editor.update(
    () => {
      const paragraph = new ParagraphNode();
      const linkNode = $createLinkNode("https://lexical.dev");
      const textNode = $createTextNode(text);
      linkNode.append(textNode);
      paragraph.append(linkNode);
      $getRoot().append(paragraph);
      linkKey = linkNode.getKey();
    },
    { discrete: true }
  );
  return linkKey;
};

/** Chip Edit flow: the whole link node is selected via `linkNode.select()`. */
const selectWholeLink = async (
  editor: Awaited<ReturnType<typeof createTestEditor>>,
  linkKey: string
) => {
  await editor.update(
    () => {
      const node = editor.getEditorState()._nodeMap.get(linkKey);
      if ($isElementNode(node)) {
        node.select();
      } else if ($isTextNode(node)) {
        node.select(0);
      }
    },
    { discrete: true }
  );
};

/** Toolbar/Cmd+K flow: a text-point selection inside the link. */
const selectLinkText = async (
  editor: Awaited<ReturnType<typeof createTestEditor>>,
  linkKey: string
) => {
  await editor.update(
    () => {
      const linkNode = editor.getEditorState()._nodeMap.get(linkKey);
      const textNode = $isElementNode(linkNode)
        ? linkNode.getFirstChild()
        : null;
      if ($isTextNode(textNode)) {
        textNode.select(0, textNode.getTextContentSize());
      }
    },
    { discrete: true }
  );
};

const readRootText = (editor: Awaited<ReturnType<typeof createTestEditor>>) =>
  editor.getEditorState().read(() => $getRoot().getTextContent());

const readLinkUrl = (editor: Awaited<ReturnType<typeof createTestEditor>>) =>
  editor.getEditorState().read(() => {
    let node = $getRoot().getFirstDescendant();
    while (node !== null && !$isLinkNode(node)) {
      node = node.getParent();
    }
    return node?.getURL() ?? "";
  });

const readCaretLocation = (
  editor: Awaited<ReturnType<typeof createTestEditor>>
) =>
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return null;
    }
    // The caret must live on an attached node whose parent is NOT the link:
    // after a successful apply the caret moves just after the link.
    const node = selection.anchor.getNode();
    return {
      anchorType: selection.anchor.type,
      attached: node.isAttached(),
      parentIsLink: $isLinkNode(node.getParent()),
    };
  });

const applyAndFlush = async (
  editor: Awaited<ReturnType<typeof createTestEditor>>,
  linkUrl: string,
  linkText: string
) => {
  // `applyToolbarLink` queues its updates; give the microtask queue a tick
  // so the reads below see the committed editor state.
  applyToolbarLink(editor, linkUrl, linkText);
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
};

describe("submitToolbarLinkText (link title edit)", () => {
  test("applies an edited title when the whole link node is selected", async () => {
    const editor = createTestEditor();
    const linkKey = await seedLink(editor, "Old text");
    await selectWholeLink(editor, linkKey);

    await applyAndFlush(editor, "https://lexical.dev", "New title");

    strictEqual(readRootText(editor), "New title");
    strictEqual(readLinkUrl(editor), "https://lexical.dev");
  });

  test("applies an edited title from a text selection inside the link", async () => {
    const editor = createTestEditor();
    const linkKey = await seedLink(editor, "Old text");
    await selectLinkText(editor, linkKey);

    await applyAndFlush(editor, "https://lexical.dev", "New title");

    strictEqual(readRootText(editor), "New title");
    strictEqual(readLinkUrl(editor), "https://lexical.dev");
  });

  test("keeps the existing label when the text field is emptied", async () => {
    const editor = createTestEditor();
    const linkKey = await seedLink(editor, "Old text");
    await selectWholeLink(editor, linkKey);

    applyToolbarLink(editor, "https://lexical.dev", "");

    strictEqual(readRootText(editor), "Old text");
  });

  test("applies both url and title edits in one submit", async () => {
    const editor = createTestEditor();
    const linkKey = await seedLink(editor, "Old text");
    await selectLinkText(editor, linkKey);

    await applyAndFlush(editor, "https://example.com", "Renamed");

    strictEqual(readRootText(editor), "Renamed");
    strictEqual(readLinkUrl(editor), "https://example.com");
  });

  test("leaves the caret on a live node after applying", async () => {
    const editor = createTestEditor();
    const linkKey = await seedLink(editor, "Old text");
    await selectWholeLink(editor, linkKey);

    await applyAndFlush(editor, "https://lexical.dev", "New title");

    deepStrictEqual(await readCaretLocation(editor), {
      anchorType: "element",
      attached: true,
      parentIsLink: false,
    });
  });

  test("preserves the first text child's format and style", async () => {
    const editor = createTestEditor();
    await editor.update(
      () => {
        const paragraph = new ParagraphNode();
        const linkNode = $createLinkNode("https://lexical.dev");
        const boldNode = $createTextNode("Bold text");
        boldNode.setFormat(1);
        boldNode.setStyle("color: red;");
        linkNode.append(boldNode);
        paragraph.append(linkNode);
        $getRoot().append(paragraph);
      },
      { discrete: true }
    );
    const linkNode = editor
      .getEditorState()
      .read(() => $getRoot().getFirstDescendant()?.getParent());
    if (!(linkNode && $isLinkNode(linkNode))) {
      throw new Error("seed failed");
    }
    await selectWholeLink(editor, linkNode.getKey());

    applyToolbarLink(editor, "https://lexical.dev", "New title");
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });

    const format = editor.getEditorState().read(() => {
      let node = $getRoot().getFirstDescendant();
      while (node !== null && !$isLinkNode(node)) {
        node = node.getParent();
      }
      if (node === null) {
        return null;
      }
      const textChild = node.getFirstChild();
      if (!$isTextNode(textChild)) {
        return null;
      }
      return {
        format: textChild.getFormat(),
        style: textChild.getStyle(),
      };
    });
    deepStrictEqual(format, { format: 1, style: "color: red;" });
  });
});
