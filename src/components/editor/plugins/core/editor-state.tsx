"use client";

import type { Transformer } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import type { LexicalEditor } from "lexical";
import { useEffect } from "react";
import type { EditorSnapshot } from "../../core/types";
import {
  loadMarkdownContent,
  readEditorSnapshot,
  readEditorTextContent,
  replaceEditorHtmlContent,
} from "../../core/utils";

export interface EditorStatePluginProps {
  initialHtml?: string;
  initialMarkdown?: string;
  onChange?: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  transformers?: readonly Transformer[];
}

export function EditorStatePlugin({
  initialHtml,
  initialMarkdown,
  onChange,
  onSnapshotReady,
  transformers,
}: EditorStatePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialMarkdown) {
      loadMarkdownContent(editor, initialMarkdown, {
        select: false,
        transformers,
      });
      return;
    }

    if (initialHtml) {
      replaceEditorHtmlContent(editor, initialHtml, { select: false });
    }
  }, [editor, initialHtml, initialMarkdown, transformers]);

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(_, activeEditor) => {
        onChange?.(readEditorTextContent(activeEditor), activeEditor);
        onSnapshotReady?.(
          readEditorSnapshot(activeEditor, transformers),
          activeEditor
        );
      }}
    />
  );
}
