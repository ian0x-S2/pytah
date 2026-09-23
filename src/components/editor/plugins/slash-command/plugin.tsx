"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
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
import { useEffect, useEffectEvent, useReducer, useRef } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { createSlashMenuAnchor, getSelectionRectangle } from "./anchor";
import type { FeatureSlashCommand, SlashCommandSelection } from "./types";
import {
  filterSlashCommands,
  getFirstCommandId,
  getNeighborCommandId,
  getSelectedCommandIndex,
  getSlashQueryMatch,
  hasSelectedCommand,
} from "./utils";

const SLASH_MENU_COLLISION_AVOIDANCE = {
  align: "none",
  fallbackAxisSide: "none",
  side: "flip",
} as const;

export interface SlashCommandPluginProps {
  /**
   * Resolved slash-menu contributions: the core block types plus every entry
   * contributed by installed feature descriptors. The composition surface
   * builds this list — the menu renders exactly what it receives.
   */
  commands: readonly FeatureSlashCommand[];
}

interface SlashCommandState {
  isOpen: boolean;
  query: string;
  rawSelectedCommandId: SlashCommandSelection;
}

type SlashCommandAction =
  | { type: "patch"; payload: Partial<SlashCommandState> }
  | {
      type: "move-selected-command";
      payload: {
        commands: readonly FeatureSlashCommand[];
        direction: "down" | "up";
      };
    };

const createInitialSlashCommandState = (
  rawSelectedCommandId: SlashCommandSelection
): SlashCommandState => ({
  isOpen: false,
  query: "",
  rawSelectedCommandId,
});

const applySlashCommandPatch = (
  state: SlashCommandState,
  patch: Partial<SlashCommandState>
): SlashCommandState => {
  for (const key of Object.keys(patch) as (keyof SlashCommandState)[]) {
    if (state[key] !== patch[key]) {
      return { ...state, ...patch };
    }
  }

  return state;
};

const slashCommandReducer = (
  state: SlashCommandState,
  action: SlashCommandAction
): SlashCommandState => {
  switch (action.type) {
    case "patch": {
      return applySlashCommandPatch(state, action.payload);
    }
    case "move-selected-command": {
      return applySlashCommandPatch(state, {
        rawSelectedCommandId: getNeighborCommandId(
          action.payload.commands.map((entry) => entry.command),
          state.rawSelectedCommandId,
          action.payload.direction
        ),
      });
    }
    default: {
      return state;
    }
  }
};

export function SlashCommandPlugin({ commands }: SlashCommandPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [state, dispatch] = useReducer(
    slashCommandReducer,
    getFirstCommandId(commands.map((entry) => entry.command)),
    createInitialSlashCommandState
  );
  const { isOpen, query, rawSelectedCommandId } = state;
  const commandListRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  const filteredCommands = filterSlashCommands(
    commands.map((entry) => entry.command),
    query
  );
  const filteredEntries = commands.filter((entry) =>
    filteredCommands.some((command) => command.id === entry.command.id)
  );

  const selectedCommandId: SlashCommandSelection = (() => {
    if (filteredCommands.length === 0) {
      return "";
    }

    return hasSelectedCommand(filteredCommands, rawSelectedCommandId)
      ? rawSelectedCommandId
      : getFirstCommandId(filteredCommands);
  })();

  const selectedIndex = getSelectedCommandIndex(
    filteredCommands,
    selectedCommandId
  );

  const anchor = createSlashMenuAnchor(editor);

  const updateSlashMenu = () => {
    const selection = $getSelection();
    const isCollapsedRangeSelection =
      $isRangeSelection(selection) && selection.isCollapsed();

    if (!isCollapsedRangeSelection) {
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    const node = selection.anchor.getNode();
    if (!$isTextNode(node)) {
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    const textUpToCursor = node
      .getTextContent()
      .slice(0, selection.anchor.offset);
    const nextQuery = getSlashQueryMatch(textUpToCursor);

    if (nextQuery === null) {
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    if (!getSelectionRectangle(editor)) {
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    dispatch({
      payload: { isOpen: true, query: nextQuery },
      type: "patch",
    });
  };

  const scheduleSlashMenuUpdate = useEffectEvent(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      editor.getEditorState().read(() => {
        updateSlashMenu();
      });
    });
  });

  const executeEntry = useEffectEvent((entry: FeatureSlashCommand) => {
    dispatch({ payload: { isOpen: false }, type: "patch" });
    entry.run(editor);
  });

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

  useEffect(
    () =>
      editor.registerUpdateListener(() => {
        scheduleSlashMenuUpdate();
      }),
    [editor]
  );

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
    },
    []
  );

  const onKeyCommand = useEffectEvent(
    (command: "arrow-down" | "arrow-up" | "enter" | "escape") => {
      switch (command) {
        case "arrow-down": {
          dispatch({
            payload: { commands, direction: "down" },
            type: "move-selected-command",
          });
          return;
        }
        case "arrow-up": {
          dispatch({
            payload: { commands, direction: "up" },
            type: "move-selected-command",
          });
          return;
        }
        case "enter": {
          const selectedEntry = filteredEntries[selectedIndex];
          if (selectedEntry) {
            executeEntry(selectedEntry);
          }
          return;
        }
        case "escape": {
          dispatch({ payload: { isOpen: false }, type: "patch" });
          break;
        }
        default: {
          break;
        }
      }
    }
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          event.preventDefault();
          onKeyCommand("arrow-down");
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          event.preventDefault();
          onKeyCommand("arrow-up");
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          event?.preventDefault();
          onKeyCommand("enter");
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          onKeyCommand("escape");
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, isOpen]);

  return (
    <PopoverPrimitive.Root
      modal={false}
      open={isOpen && filteredCommands.length > 0}
    >
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          align="start"
          anchor={anchor}
          className="isolate z-50"
          collisionAvoidance={SLASH_MENU_COLLISION_AVOIDANCE}
          positionMethod="fixed"
          side="bottom"
          sideOffset={4}
        >
          <PopoverPrimitive.Popup
            className={cn(
              "z-50 flex w-72 origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
            data-slot="slash-command-popover"
            finalFocus={false}
            initialFocus={false}
            onFocus={(event) => {
              // `initialFocus: false` makes the focus manager grab focus for
              // the popup, stealing the caret from the editor. Bounce focus
              // back to the editor root so typing continues seamlessly.
              const rootElement = editor.getRootElement();
              if (
                rootElement &&
                event.target !== rootElement &&
                !rootElement.contains(event.target)
              ) {
                rootElement.focus({ preventScroll: true });
              }
            }}
          >
            <Command shouldFilter={false} value={selectedCommandId}>
              <CommandList ref={commandListRef}>
                <CommandGroup heading="Blocks">
                  {filteredEntries.map((entry, index) => {
                    const { command } = entry;
                    return (
                      <CommandItem
                        className={
                          index === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }
                        key={command.id}
                        onMouseMove={(event) => {
                          const previousPosition =
                            lastPointerPositionRef.current;
                          lastPointerPositionRef.current = {
                            x: event.clientX,
                            y: event.clientY,
                          };

                          if (!previousPosition) {
                            return;
                          }

                          const hasPointerMoved =
                            previousPosition.x !== event.clientX ||
                            previousPosition.y !== event.clientY;

                          if (!hasPointerMoved) {
                            return;
                          }

                          dispatch({
                            payload: { rawSelectedCommandId: command.id },
                            type: "patch",
                          });
                        }}
                        onSelect={() => {
                          // Inline (not `executeEntry`): cmdk invokes this
                          // from user-interaction handlers, outside Effects.
                          dispatch({
                            payload: { isOpen: false },
                            type: "patch",
                          });
                          entry.run(editor);
                        }}
                        value={command.id}
                      >
                        <command.icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm">{command.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {command.description}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {filteredCommands.length === 0 ? (
                  <CommandEmpty>No results found</CommandEmpty>
                ) : null}
              </CommandList>
            </Command>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
