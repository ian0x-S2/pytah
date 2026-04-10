import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical";
import { EDITOR_MARKDOWN_TRANSFORMERS } from "../plugins/markdown/transformers";
import type { EditorSnapshot } from "./types";

export const createEmptyEditorState = (editor: LexicalEditor) => {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(""));
    root.append(paragraph);
    root.selectStart();
  });
};

export const readEditorSnapshot = (editor: LexicalEditor): EditorSnapshot => {
  let snapshot: EditorSnapshot = {
    html: "",
    markdown: "",
    text: "",
  };

  editor.getEditorState().read(() => {
    snapshot = {
      html: $generateHtmlFromNodes(editor),
      markdown: $convertToMarkdownString(EDITOR_MARKDOWN_TRANSFORMERS),
      text: $getRoot().getTextContent(),
    };
  });

  return snapshot;
};

export const loadMarkdownContent = (
  editor: LexicalEditor,
  markdown: string
) => {
  editor.update(() => {
    $convertFromMarkdownString(markdown, EDITOR_MARKDOWN_TRANSFORMERS);
    $getRoot().selectEnd();
  });
};

export const replaceEditorHtmlContent = (
  editor: LexicalEditor,
  html: string
) => {
  editor.update(() => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, "text/html");
    const nodes = $generateNodesFromDOM(editor, dom);
    const root = $getRoot();

    root.clear();

    if (nodes.length === 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(""));
      root.append(paragraph);
      paragraph.selectEnd();
      return;
    }

    root.append(...nodes);
    root.selectEnd();
  });
};
