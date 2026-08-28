import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import type { Transformer } from "@lexical/markdown";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  $addUpdateTag,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
} from "lexical";
import { BUILTIN_MARKDOWN_TRANSFORMERS } from "../plugins/markdown/transformers";
import type { EditorSnapshot, EditorSnapshotOutputs } from "./types";

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

/** Fallback transformers used when no feature-derived set is supplied. */
const DEFAULT_MARKDOWN_TRANSFORMERS = [...BUILTIN_MARKDOWN_TRANSFORMERS];

/**
 * Reads a serialized snapshot of the current editor document. Disabled
 * outputs (via `options`) are skipped entirely — their serialization code
 * never runs — and surface as `""` on the returned snapshot.
 */
export const readEditorSnapshot = (
  editor: LexicalEditor,
  transformers: readonly Transformer[] = DEFAULT_MARKDOWN_TRANSFORMERS,
  options?: EditorSnapshotOutputs
): EditorSnapshot => {
  const serializeHtml = options?.html ?? true;
  const serializeMarkdown = options?.markdown ?? true;
  const serializeText = options?.text ?? true;

  const snapshot: EditorSnapshot = {
    html: "",
    markdown: "",
    text: "",
  };

  editor.getEditorState().read(() => {
    if (serializeHtml) {
      snapshot.html = $generateHtmlFromNodes(editor);
    }
    if (serializeMarkdown) {
      snapshot.markdown = $convertToMarkdownString([...transformers]);
    }
    if (serializeText) {
      snapshot.text = $getRoot().getTextContent();
    }
  });

  return snapshot;
};

export const readEditorTextContent = (editor: LexicalEditor): string => {
  let textContent = "";

  editor.getEditorState().read(() => {
    textContent = $getRoot().getTextContent();
  });

  return textContent;
};

export interface EditorContentLoadOptions {
  /** Place the caret at the start of the loaded content. Defaults to `true`. */
  select?: boolean;
  /**
   * Optional update tag applied via `$addUpdateTag` inside the update, so
   * update listeners can identify programmatic loads (e.g. the mount seed).
   */
  tag?: string;
}

const selectStartOfRoot = () => {
  const root = $getRoot();
  const firstDescendant = root.getFirstDescendant();
  if (firstDescendant) {
    firstDescendant.selectStart();
    return;
  }

  const firstChild = root.getFirstChild();
  if (firstChild) {
    firstChild.selectStart();
    return;
  }

  root.selectStart();
};

export const loadMarkdownContent = (
  editor: LexicalEditor,
  markdown: string,
  options?: EditorContentLoadOptions & {
    transformers?: readonly Transformer[];
  }
) => {
  const transformers = options?.transformers ?? DEFAULT_MARKDOWN_TRANSFORMERS;

  editor.update(() => {
    if (options?.tag) {
      $addUpdateTag(options.tag);
    }
    $convertFromMarkdownString(markdown, [...transformers]);
    if (options?.select !== false) {
      selectStartOfRoot();
    }
  });
};

export const replaceEditorHtmlContent = (
  editor: LexicalEditor,
  html: string,
  options?: EditorContentLoadOptions
) => {
  editor.update(() => {
    if (options?.tag) {
      $addUpdateTag(options.tag);
    }
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, "text/html");
    const nodes = $generateNodesFromDOM(editor, dom);
    const root = $getRoot();

    root.clear();

    if (nodes.length === 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(""));
      root.append(paragraph);
      if (options?.select !== false) {
        paragraph.selectStart();
      }
      return;
    }

    root.append(...nodes);
    if (options?.select !== false) {
      selectStartOfRoot();
    }
  });
};
