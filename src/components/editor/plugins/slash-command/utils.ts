import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
} from "lexical";
import type { ElementNode, LexicalEditor, LexicalNode } from "lexical";

import type { SlashCommand, SlashCommandSelection } from "./types";

export const SLASH_QUERY_PATTERN = /^\/(?<query>\w*)$/u;

export const filterSlashCommands = (
  commands: readonly SlashCommand[],
  query: string
): readonly SlashCommand[] => {
  if (!query) {
    return commands;
  }

  const normalizedQuery = query.toLowerCase();

  return commands.filter(
    (command) =>
      command.label.toLowerCase().includes(normalizedQuery) ||
      command.keywords.some((keyword) => keyword.includes(normalizedQuery))
  );
};

export const getFirstCommandId = (
  commands: readonly SlashCommand[]
): SlashCommandSelection => commands[0]?.id ?? "";

export const getSelectedCommandIndex = (
  commands: readonly SlashCommand[],
  selectedCommandId: SlashCommandSelection
): number => commands.findIndex((command) => command.id === selectedCommandId);

export const getNeighborCommandId = (
  commands: readonly SlashCommand[],
  selectedCommandId: SlashCommandSelection,
  direction: "down" | "up"
): SlashCommandSelection => {
  const currentIndex = getSelectedCommandIndex(commands, selectedCommandId);

  if (currentIndex < 0) {
    return direction === "down"
      ? (commands.at(1)?.id ?? getFirstCommandId(commands))
      : (commands.at(-1)?.id ?? getFirstCommandId(commands));
  }

  const nextIndex =
    direction === "down"
      ? Math.min(currentIndex + 1, commands.length - 1)
      : Math.max(currentIndex - 1, 0);

  return commands[nextIndex]?.id ?? selectedCommandId;
};

export const hasSelectedCommand = (
  commands: readonly SlashCommand[],
  selectedCommandId: SlashCommandSelection
): boolean => commands.some((command) => command.id === selectedCommandId);

export const getSlashQueryMatch = (textUpToCursor: string): string | null => {
  const match = textUpToCursor.match(SLASH_QUERY_PATTERN);

  return match?.groups?.query ?? null;
};

const $resolveNearestBlockElement = (node: LexicalNode): ElementNode | null => {
  let current: LexicalNode | null = node;
  while (current !== null && !$isRootNode(current)) {
    if ($isElementNode(current) && !current.isInline()) {
      return current;
    }
    current = current.getParent();
  }
  return null;
};

/**
 * Runs a block-level replacement against the current selection:
 * - On a text node: clears its text (slash query) and hands the nearest
 *   enclosing block element to `replace` without destroying nested containers
 *   like tables, callouts, or collapsibles.
 * - On an empty block element (e.g. empty paragraph): replaces it directly.
 * - On `RootNode`: appends a fresh paragraph and replaces it.
 */
export const replaceCurrentBlock = (
  editor: LexicalEditor,
  replace: (element: ElementNode) => void
): void => {
  editor.update(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      return;
    }

    const node = selection.anchor.getNode();

    if ($isTextNode(node)) {
      node.setTextContent("");
      const block =
        $resolveNearestBlockElement(node) ?? node.getTopLevelElement();
      if (block && $isElementNode(block)) {
        replace(block);
      }
      return;
    }

    if ($isRootNode(node)) {
      const paragraph = $createParagraphNode();
      node.append(paragraph);
      paragraph.select();
      replace(paragraph);
      return;
    }

    const block = $resolveNearestBlockElement(node);
    if (block) {
      replace(block);
    }
  });
};

/**
 * Runs an insert-style command from a toolbar surface without destroying
 * existing text: replaces the current block only if it is an empty paragraph
 * (or holds a slash query), otherwise inserts a new paragraph below it first.
 */
export const runToolbarInsert = (
  editor: LexicalEditor,
  run: (editor: LexicalEditor) => void
): void => {
  editor.update(
    () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);
        paragraph.select();
        return;
      }

      const anchorNode = selection.anchor.getNode();
      const topLevel = anchorNode.getTopLevelElement();

      if (!topLevel) {
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);
        paragraph.select();
        return;
      }

      const trimmedText = topLevel.getTextContent().trim();
      const isEmptyParagraph =
        $isParagraphNode(topLevel) && trimmedText.length === 0;
      const isSlashQuery =
        $isParagraphNode(topLevel) && SLASH_QUERY_PATTERN.test(trimmedText);

      if (!(isEmptyParagraph || isSlashQuery)) {
        const paragraph = $createParagraphNode();
        topLevel.insertAfter(paragraph);
        paragraph.select();
      }
    },
    { discrete: true }
  );

  run(editor);
};
