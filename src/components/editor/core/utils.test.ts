import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { createHeadlessEditor } from "@lexical/headless";
import type { LexicalEditor } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { createEditorConfig } from "./config";
import { EDITOR_SEED_UPDATE_TAG } from "./constants";
import {
  loadMarkdownContent,
  readEditorSnapshot,
  readEditorTextContent,
} from "./utils";

const createTestEditor = (): LexicalEditor => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: [],
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

/**
 * Fixture whose markdown round-trips byte-for-byte: heading, inline marks,
 * a horizontal rule (the one block whose HTML output differs most from its
 * markdown form) and a list. This file runs DOM-free, so HTML serialization
 * stays disabled here — the html-enabled assertions live in the happy-dom
 * component suite (`plugins/core/editor-state.test.tsx`).
 */
const SEED_MARKDOWN = [
  "# Title",
  "",
  "Hello **world** with `code`.",
  "",
  "---",
  "",
  "- first",
  "- second",
].join("\n");

/**
 * Headless editors defer update commits to a microtask; snapshot reads and
 * update listeners only observe them after that tick.
 */
const flushUpdates = async () => {
  await new Promise<void>((resolve) => {
    queueMicrotask(() => {
      resolve();
    });
  });
};

const seedTestEditor = async (editor: LexicalEditor) => {
  loadMarkdownContent(editor, SEED_MARKDOWN, { select: false });
  await flushUpdates();
};

describe("readEditorSnapshot", () => {
  test("round-trips markdown byte-for-byte with text enabled", async () => {
    const editor = createTestEditor();
    await seedTestEditor(editor);

    const snapshot = readEditorSnapshot(editor, undefined, {
      html: false,
      markdown: true,
      text: true,
    });

    strictEqual(snapshot.markdown, SEED_MARKDOWN);
    strictEqual(snapshot.text.includes("Hello **world**"), false);
    strictEqual(snapshot.text.includes("Hello"), true);
  });

  test("html: false skips HTML serialization but keeps markdown intact", async () => {
    const editor = createTestEditor();
    await seedTestEditor(editor);

    const snapshot = readEditorSnapshot(editor, undefined, {
      html: false,
      markdown: true,
      text: true,
    });

    strictEqual(snapshot.html, "");
    // The document contains a horizontal rule — markdown serialization still
    // ran (and round-trips), only the HTML output was skipped.
    strictEqual(snapshot.markdown, SEED_MARKDOWN);
    strictEqual(snapshot.text.includes("Hello"), true);
  });

  test("text: false skips text serialization but keeps markdown", async () => {
    const editor = createTestEditor();
    await seedTestEditor(editor);

    const snapshot = readEditorSnapshot(editor, undefined, {
      html: false,
      markdown: true,
      text: false,
    });

    strictEqual(snapshot.text, "");
    strictEqual(snapshot.markdown, SEED_MARKDOWN);
  });

  test("disabled outputs stay empty on content with no serialization cost", async () => {
    const editor = createTestEditor();
    editor.update(() => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(""));
      $getRoot().append(paragraph);
    });
    await flushUpdates();

    const snapshot = readEditorSnapshot(editor, undefined, {
      html: false,
      markdown: true,
      text: false,
    });

    strictEqual(snapshot.html, "");
    strictEqual(snapshot.text, "");
  });
});

describe("readEditorTextContent", () => {
  test("reads the plain text content", async () => {
    const editor = createTestEditor();
    await seedTestEditor(editor);

    strictEqual(readEditorTextContent(editor).includes("Hello"), true);
  });
});

describe("content loader update tags", () => {
  test("loadMarkdownContent forwards the requested update tag", async () => {
    const editor = createTestEditor();
    const seenTags: string[][] = [];
    editor.registerUpdateListener(({ tags }) => {
      seenTags.push([...tags]);
    });

    loadMarkdownContent(editor, SEED_MARKDOWN, {
      select: false,
      tag: EDITOR_SEED_UPDATE_TAG,
    });
    await flushUpdates();

    strictEqual(seenTags[0]?.includes(EDITOR_SEED_UPDATE_TAG), true);
  });

  test("loadMarkdownContent without a tag applies no seed tag", async () => {
    const editor = createTestEditor();
    const seenTags: string[][] = [];
    editor.registerUpdateListener(({ tags }) => {
      seenTags.push([...tags]);
    });

    loadMarkdownContent(editor, SEED_MARKDOWN, { select: false });
    await flushUpdates();

    strictEqual(seenTags[0]?.includes(EDITOR_SEED_UPDATE_TAG), false);
  });
});
