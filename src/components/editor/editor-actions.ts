import type { LexicalEditor } from "lexical";
import { HTML_EXAMPLE, MARKDOWN_EXAMPLE } from "./editor-constants";
import {
  createEmptyEditorState,
  loadMarkdownContent,
  replaceEditorHtmlContent,
} from "./editor-utils";

export const copyEditorOutput = async (value: string) => {
  await navigator.clipboard.writeText(value);
};

export const resetEditorContent = (editor: LexicalEditor) => {
  createEmptyEditorState(editor);
};

export const loadEditorHtmlExample = (editor: LexicalEditor) => {
  replaceEditorHtmlContent(editor, HTML_EXAMPLE);
};

export const loadEditorMarkdownExample = (editor: LexicalEditor) => {
  loadMarkdownContent(editor, MARKDOWN_EXAMPLE);
};
