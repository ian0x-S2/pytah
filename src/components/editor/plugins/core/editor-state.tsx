"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import type { LexicalEditor } from "lexical";
import { useEffect } from "react";
import type { EditorSnapshot } from "../../core/types";
import {
  createEmptyEditorState,
  loadMarkdownContent,
  readEditorSnapshot,
  replaceEditorHtmlContent,
} from "../../core/utils";

export interface EditorStatePluginProps {
  initialHtml?: string;
  initialMarkdown?: string;
  onChange?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
}

export function EditorStatePlugin({
  initialHtml,
  initialMarkdown,
  onChange,
}: EditorStatePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialMarkdown) {
      loadMarkdownContent(editor, initialMarkdown);
      return;
    }

    if (initialHtml) {
      replaceEditorHtmlContent(editor, initialHtml);
      return;
    }

    createEmptyEditorState(editor);
  }, [editor, initialHtml, initialMarkdown]);

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(_, activeEditor) => {
        if (!onChange) {
          return;
        }

        onChange(readEditorSnapshot(activeEditor), activeEditor);
      }}
    />
  );
}
