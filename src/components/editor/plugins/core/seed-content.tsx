"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useContext, useEffect } from "react";
import {
  DEFAULT_EDITOR_MARKDOWN,
  EDITOR_SEED_UPDATE_TAG,
} from "../../core/constants";
import { EditorTransformersContext } from "../../core/editor-transformers-context";
import { loadMarkdownContent, readEditorTextContent } from "../../core/utils";

/**
 * Seeds the example document when the editor is empty. The transformer set
 * comes from the composition surface via context, so seeding respects every
 * installed feature's markdown syntax.
 */
export function SeedContentPlugin() {
  const [editor] = useLexicalComposerContext();
  const transformers = useContext(EditorTransformersContext);

  useEffect(() => {
    if (readEditorTextContent(editor).trim()) {
      return;
    }

    loadMarkdownContent(editor, DEFAULT_EDITOR_MARKDOWN, {
      select: false,
      tag: EDITOR_SEED_UPDATE_TAG,
      transformers,
    });
  }, [editor, transformers]);

  return null;
}
