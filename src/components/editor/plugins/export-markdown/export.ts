import type { Transformer } from "@lexical/markdown";
import type { LexicalEditor } from "lexical";
import { downloadMarkdownContent } from "../../core/actions";
import { readEditorSnapshot } from "../../core/utils";

/**
 * Derives a filesystem-safe name from the first non-empty line of the
 * document, falling back to `document` when the editor is blank.
 */
export const getMarkdownExportFilename = (textContent: string): string => {
  const firstLine = textContent
    .split("\n")
    .find((line) => line.trim().length > 0);

  const slugified = (firstLine ?? "document")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slugified || "document";
};

/**
 * Serializes the current editor state to markdown (via `$convertToMarkdownString`,
 * the same path the output panel uses) and downloads it as a `.md` file.
 */
export const exportMarkdownToFile = (
  editor: LexicalEditor,
  transformers: readonly Transformer[]
) => {
  const snapshot = readEditorSnapshot(editor, transformers);
  downloadMarkdownContent(
    snapshot.markdown,
    getMarkdownExportFilename(snapshot.text)
  );
};
