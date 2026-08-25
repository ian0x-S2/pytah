"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { useEditorTransformers } from "../../core/editor-transformers-context";
import { EXPORT_MARKDOWN_COMMAND } from "./commands";
import { exportMarkdownToFile } from "./export";

/**
 * Feature entrypoint for markdown export. Registers the export command against
 * the live editor so any surface (default action bar, consumer chrome) can
 * trigger a `.md` download with a single dispatch.
 *
 * Mounted for both editable and read-only modes: read-only documents should
 * stay exportable.
 */
export function MarkdownExportPlugin() {
  const [editor] = useLexicalComposerContext();
  const transformers = useEditorTransformers();

  useEffect(() => {
    return editor.registerCommand(
      EXPORT_MARKDOWN_COMMAND,
      () => {
        exportMarkdownToFile(editor, transformers);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, transformers]);

  return null;
}
