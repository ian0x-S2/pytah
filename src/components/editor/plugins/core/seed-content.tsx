"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import { useEffect } from "react";
import { DEFAULT_EDITOR_MARKDOWN } from "../../core/constants";
import { loadMarkdownContent, readEditorSnapshot } from "../../core/utils";

interface SeedContentPluginProps {
  editor?: LexicalEditor | null;
}

export function SeedContentPlugin({
  editor: propEditor,
}: SeedContentPluginProps) {
  const [contextEditor] = useLexicalComposerContext();
  const editor = propEditor ?? contextEditor;

  useEffect(() => {
    if (!editor) {
      return;
    }

    const snapshot = readEditorSnapshot(editor);
    if (snapshot.text.trim()) {
      return;
    }

    loadMarkdownContent(editor, DEFAULT_EDITOR_MARKDOWN);
  }, [editor]);

  return null;
}
