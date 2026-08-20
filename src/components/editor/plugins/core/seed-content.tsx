"use client";

import type { Transformer } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import { useEffect } from "react";
import { DEFAULT_EDITOR_MARKDOWN } from "../../core/constants";
import { loadMarkdownContent, readEditorSnapshot } from "../../core/utils";

interface SeedContentPluginProps {
  editor?: LexicalEditor | null;
  transformers?: readonly Transformer[];
}

export function SeedContentPlugin({
  editor: propEditor,
  transformers,
}: SeedContentPluginProps) {
  const [contextEditor] = useLexicalComposerContext();
  const editor = propEditor ?? contextEditor;

  useEffect(() => {
    if (!editor) {
      return;
    }

    const snapshot = readEditorSnapshot(editor, transformers);
    if (snapshot.text.trim()) {
      return;
    }

    loadMarkdownContent(editor, DEFAULT_EDITOR_MARKDOWN, {
      select: false,
      transformers,
    });
  }, [editor, transformers]);

  return null;
}
