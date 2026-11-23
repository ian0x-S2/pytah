import type { Transformer } from "@lexical/markdown";
import type { LexicalEditor } from "lexical";

import { HTML_EXAMPLE, MARKDOWN_EXAMPLE } from "./constants";
import {
  createEmptyEditorState,
  loadMarkdownContent,
  replaceEditorHtmlContent,
} from "./utils";

export const copyEditorOutput = async (value: string): Promise<boolean> => {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Triggers a browser download of the given markdown as a `.md` file, reusing
 * the same serialized markdown the output panel already exposes.
 */
export const downloadMarkdownContent = (
  content: string,
  filename = "document.md"
) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const resetEditorContent = (editor: LexicalEditor) => {
  createEmptyEditorState(editor);
};

export const loadEditorHtmlExample = (editor: LexicalEditor) => {
  replaceEditorHtmlContent(editor, HTML_EXAMPLE);
};

export const loadEditorMarkdownExample = (
  editor: LexicalEditor,
  transformers?: readonly Transformer[]
) => {
  loadMarkdownContent(editor, MARKDOWN_EXAMPLE, { transformers });
};
