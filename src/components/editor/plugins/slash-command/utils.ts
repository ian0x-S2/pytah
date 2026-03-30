import type { SlashCommand, SlashCommandSelection } from "./types";

const SLASH_QUERY_PATTERN = /^\/(\w*)$/;

export const filterSlashCommands = (
  commands: SlashCommand[],
  query: string
): SlashCommand[] => {
  if (!query) {
    return commands;
  }

  const normalizedQuery = query.toLowerCase();

  return commands.filter((command) => {
    return (
      command.label.toLowerCase().includes(normalizedQuery) ||
      command.keywords.some((keyword) => keyword.includes(normalizedQuery))
    );
  });
};

export const getFirstCommandId = (
  commands: SlashCommand[]
): SlashCommandSelection => {
  return commands[0]?.id ?? "";
};

export const getSelectedCommandIndex = (
  commands: SlashCommand[],
  selectedCommandId: SlashCommandSelection
): number => {
  return commands.findIndex((command) => command.id === selectedCommandId);
};

export const getNeighborCommandId = (
  commands: SlashCommand[],
  selectedCommandId: SlashCommandSelection,
  direction: "down" | "up"
): SlashCommandSelection => {
  const currentIndex = getSelectedCommandIndex(commands, selectedCommandId);

  if (currentIndex < 0) {
    return getFirstCommandId(commands);
  }

  const nextIndex =
    direction === "down"
      ? Math.min(currentIndex + 1, commands.length - 1)
      : Math.max(currentIndex - 1, 0);

  return commands[nextIndex]?.id ?? selectedCommandId;
};

export const hasSelectedCommand = (
  commands: SlashCommand[],
  selectedCommandId: SlashCommandSelection
): boolean => {
  return commands.some((command) => command.id === selectedCommandId);
};

export const getSlashQueryMatch = (textUpToCursor: string): string | null => {
  const match = textUpToCursor.match(SLASH_QUERY_PATTERN);

  return match?.[1] ?? null;
};
