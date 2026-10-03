import { $getSelection, $isRangeSelection, $isTextNode } from "lexical";
import type { ElementNode, LexicalEditor } from "lexical";

import type { SlashCommand, SlashCommandSelection } from "./types";

export const SLASH_QUERY_PATTERN = /^\/(?<query>\w*)$/u;

export const filterSlashCommands = (
  commands: readonly SlashCommand[],
  query: string
): SlashCommand[] => {
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

  // A stale selection (the query filtered it out) acts as if it sat at the
  // effective highlight edge, so the very first arrow key press moves off it
  // instead of re-syncing to the first item.
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

/**
 * Runs a block-level replacement against the current selection: clears the
 * text content of the selected text node and hands the enclosing top-level
 * element to the callback. Mirrors the flow the slash menu has always used
 * for direct executors.
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

    if (!$isTextNode(node)) {
      return;
    }

    node.setTextContent("");
    replace(node.getTopLevelElementOrThrow());
  });
};
