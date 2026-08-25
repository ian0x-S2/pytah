"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useContext, useEffect } from "react";
import { DEFAULT_EDITOR_MARKDOWN } from "../../core/constants";
import { EditorTransformersContext } from "../../core/editor-transformers-context";
import { loadMarkdownContent, readEditorSnapshot } from "../../core/utils";

/**
 * Seeds the example document when the editor is empty. The transformer set
 * comes from the composition surface via context, so seeding respects every
 * installed feature's markdown syntax.
 */
export function SeedContentPlugin() {
  const [editor] = useLexicalComposerContext();
  const transformers = useContext(EditorTransformersContext);

  useEffect(() => {
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
