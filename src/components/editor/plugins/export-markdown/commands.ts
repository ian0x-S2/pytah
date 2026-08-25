import { createCommand } from "lexical";

/**
 * Dispatched by the default action bar (or any consumer surface) to export the
 * current editor document to a `.md` file. The `MarkdownExportPlugin` owns the
 * handler so the conversion logic stays lego-scoped and reusable outside the
 * built-in chrome.
 */
export const EXPORT_MARKDOWN_COMMAND = createCommand<void>(
  "export-markdown-command"
);
