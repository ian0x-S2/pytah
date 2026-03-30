import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SLASH_COMMANDS } from "./commands";
import { SLASH_COMMAND_EXECUTORS } from "./executors";
import type { SlashCommandId, SlashMenuPosition } from "./types";
import {
  filterSlashCommands,
  getFirstCommandId,
  getNeighborCommandId,
  getSelectedCommandIndex,
  getSlashQueryMatch,
  hasSelectedCommand,
} from "./utils";

const EMPTY_MENU_POSITION: SlashMenuPosition = {
  left: 0,
  top: 0,
};

const getSelectionRectangle = (): SlashMenuPosition | null => {
  const nativeSelection = window.getSelection();
  if (!(nativeSelection && nativeSelection.rangeCount > 0)) {
    return null;
  }

  const range = nativeSelection.getRangeAt(0);
  const rectangle = range.getBoundingClientRect();

  return {
    left: rectangle.left,
    top: rectangle.bottom + 4,
  };
};

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] =
    useState<SlashMenuPosition>(EMPTY_MENU_POSITION);
  const [query, setQuery] = useState("");
  const [selectedCommandId, setSelectedCommandId] = useState<
    SlashCommandId | ""
  >(getFirstCommandId(SLASH_COMMANDS));
  const commandListRef = useRef<HTMLDivElement | null>(null);

  const filteredCommands = useMemo(() => {
    return filterSlashCommands(SLASH_COMMANDS, query);
  }, [query]);

  const selectedIndex = useMemo(() => {
    return getSelectedCommandIndex(filteredCommands, selectedCommandId);
  }, [filteredCommands, selectedCommandId]);

  const executeCommand = useCallback(
    (commandId: SlashCommandId) => {
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

        const element = node.getTopLevelElementOrThrow();
        SLASH_COMMAND_EXECUTORS[commandId](element);
      });

      setIsOpen(false);
    },
    [editor]
  );

  useEffect(() => {
    if (filteredCommands.length === 0) {
      setSelectedCommandId("");
      return;
    }

    if (!hasSelectedCommand(filteredCommands, selectedCommandId)) {
      setSelectedCommandId(getFirstCommandId(filteredCommands));
    }
  }, [filteredCommands, selectedCommandId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedCommandId(getFirstCommandId(filteredCommands));
  }, [filteredCommands, isOpen]);

  useEffect(() => {
    if (!(isOpen && selectedCommandId)) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const selectedItemSelector = `[cmdk-item=""][data-value="${window.CSS.escape(selectedCommandId)}"]`;
      const selectedItem =
        commandListRef.current?.querySelector<HTMLElement>(
          selectedItemSelector
        );

      selectedItem?.scrollIntoView({ block: "nearest" });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, selectedCommandId]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        const isCollapsedRangeSelection =
          $isRangeSelection(selection) && selection.isCollapsed();

        if (!isCollapsedRangeSelection) {
          setIsOpen(false);
          return;
        }

        const node = selection.anchor.getNode();
        if (!$isTextNode(node)) {
          setIsOpen(false);
          return;
        }

        const textUpToCursor = node
          .getTextContent()
          .slice(0, selection.anchor.offset);
        const nextQuery = getSlashQueryMatch(textUpToCursor);

        if (nextQuery === null) {
          setIsOpen(false);
          return;
        }

        setQuery(nextQuery);

        const nextPosition = getSelectionRectangle();
        if (nextPosition) {
          setPosition(nextPosition);
        }

        setIsOpen(true);
      });
    });
  }, [editor]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          event.preventDefault();
          setSelectedCommandId((currentSelection) => {
            return getNeighborCommandId(
              filteredCommands,
              currentSelection,
              "down"
            );
          });
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          event.preventDefault();
          setSelectedCommandId((currentSelection) => {
            return getNeighborCommandId(
              filteredCommands,
              currentSelection,
              "up"
            );
          });
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          event?.preventDefault();
          const selectedCommand = filteredCommands[selectedIndex];
          if (selectedCommand) {
            executeCommand(selectedCommand.id);
          }
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          setIsOpen(false);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, executeCommand, filteredCommands, isOpen, selectedIndex]);

  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className="fade-in-0 zoom-in-95 fixed z-50 w-72 animate-in overflow-hidden rounded-lg bg-popover shadow-md ring-1 ring-foreground/10 duration-100"
      style={{ left: position.left, top: position.top }}
    >
      <Command
        onValueChange={(value) => setSelectedCommandId(value as SlashCommandId)}
        shouldFilter={false}
        value={selectedCommandId}
      >
        <CommandList ref={commandListRef}>
          <CommandGroup heading="Blocks">
            {filteredCommands.map((command, index) => (
              <CommandItem
                className={
                  index === selectedIndex ? "bg-muted text-foreground" : ""
                }
                key={command.id}
                onMouseEnter={() => setSelectedCommandId(command.id)}
                onSelect={() => executeCommand(command.id)}
                value={command.id}
              >
                <command.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{command.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {command.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          {filteredCommands.length === 0 ? (
            <CommandEmpty>No results found</CommandEmpty>
          ) : null}
        </CommandList>
      </Command>
    </div>,
    document.body
  );
}
