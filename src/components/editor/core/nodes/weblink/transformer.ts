import type {
  ElementTransformer,
  TextMatchTransformer,
} from "@lexical/markdown";

import { $isWeblinkNode, WeblinkNode } from "./node";

const NEVER_MATCH = /(?!)/u;

const formatWeblinkAsMarkdown = (node: WeblinkNode): string => {
  const title = (node.getTitle() || node.getUrl())
    .replaceAll(/\r?\n+/gu, " ")
    .replaceAll("]", "\\]");
  return `[${title}](${node.getUrl()})`;
};

/**
 * Exports block-format `WeblinkNode`s (`small` / `wide`) as standard Markdown
 * links so the URL is never lost when serializing to Markdown.
 */
export const WEBLINK_BLOCK_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [WeblinkNode],
  export: (node) => {
    if (!$isWeblinkNode(node) || node.isInline()) {
      return null;
    }

    return formatWeblinkAsMarkdown(node);
  },
  regExp: NEVER_MATCH,
  replace: () => false,
  type: "element",
};

/**
 * Exports inline-format `WeblinkNode`s as standard Markdown links so the URL is
 * preserved alongside surrounding paragraph text.
 */
export const WEBLINK_INLINE_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [WeblinkNode],
  export: (node) => {
    if (!$isWeblinkNode(node) || !node.isInline()) {
      return null;
    }

    return formatWeblinkAsMarkdown(node);
  },
  importRegExp: NEVER_MATCH,
  regExp: NEVER_MATCH,
  replace: () => {
    // Export-only: standard markdown links import as `LinkNode`.
  },
  trigger: "",
  type: "text-match",
};
