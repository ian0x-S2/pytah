"use client";

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

import { createSlashMenuAnchor, getSelectionRectangle } from "./anchor";
import { SlashCommandMenu } from "./menu";
import { createInitialSlashCommandState, slashCommandReducer } from "./state";
import type { FeatureSlashCommand, SlashCommandSelection } from "./types";
import {
  filterSlashCommands,
  getFirstCommandId,
  getSelectedCommandIndex,
  getSlashQueryMatch,
  hasSelectedCommand,
} from "./utils";

export interface SlashCommandPluginProps {
  /**
   * Resolved slash-menu contributions: the core block types plus every entry
   * contributed by installed feature descriptors. The composition surface
   * builds this list — the menu renders exactly what it receives.
   */
  commands: readonly FeatureSlashCommand[];
}

export function SlashCommandPlugin({ commands }: SlashCommandPluginProps) {
  const [editor] = useLexicalComposerContext();
  const commandIds = commands.map((entry) => entry.command);
  const [state, dispatch] = useReducer(
    slashCommandReducer,
    getFirstCommandId(commandIds),
    createInitialSlashCommandState
  );
  const { isOpen, query, rawSelectedCommandId } = state;
  const commandListRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const filteredCommands = filterSlashCommands(commandIds, query);
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

  // The menu is only actually visible when the popover renders content;
  // key handling and scroll-into-view must match this exactly.
  const isMenuVisible = isOpen && filteredCommands.length > 0;

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
      payload: {
        firstCommandId: getFirstCommandId(commandIds),
        query: nextQuery,
      },
      type: "open",
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
    if (!isMenuVisible) {
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
  }, [isMenuVisible, selectedCommandId]);

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
            // Navigate within the filtered list: moving through the full
            // list walks into entries the query hid, and the derived
            // highlight then falls back to the first filtered item —
            // freezing keyboard navigation while searching.
            payload: { commands: filteredCommands, direction: "down" },
            type: "move-selected-command",
          });
          return;
        }
        case "arrow-up": {
          dispatch({
            payload: { commands: filteredCommands, direction: "up" },
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
    // Key handling must match menu visibility exactly: with zero results the
    // popover is hidden, so arrows and enter must reach the editor.
    if (!isMenuVisible) {
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
  }, [editor, isMenuVisible]);

  const handleHoverCommand = (id: SlashCommandSelection) => {
    dispatch({
      payload: { rawSelectedCommandId: id },
      type: "patch",
    });
  };

  const handleSelectEntry = (entry: FeatureSlashCommand) => {
    // Inline (not `executeEntry`): cmdk invokes this from
    // user-interaction handlers, outside Effects.
    dispatch({
      payload: { isOpen: false },
      type: "patch",
    });
    entry.run(editor);
  };

  return (
    <SlashCommandMenu
      anchor={anchor}
      commandListRef={commandListRef}
      editor={editor}
      filteredEntries={filteredEntries}
      hasResults={filteredCommands.length > 0}
      isMenuVisible={isMenuVisible}
      onHoverCommand={handleHoverCommand}
      onSelectEntry={handleSelectEntry}
      selectedCommandId={selectedCommandId}
      selectedIndex={selectedIndex}
    />
  );
}
