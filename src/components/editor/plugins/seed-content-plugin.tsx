import type { LexicalEditor } from "lexical";
import { useEffect } from "react";
import { DEFAULT_EDITOR_MARKDOWN } from "../editor-constants";
import { loadMarkdownContent, readEditorSnapshot } from "../editor-utils";

interface SeedContentPluginProps {
  editor: LexicalEditor | null;
}

export function SeedContentPlugin({ editor }: SeedContentPluginProps) {
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
