"use client";

import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
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
import { useEffect, useEffectEvent, useMemo, useReducer, useRef } from "react";

import { createSlashMenuAnchor, getSelectionRectangle } from "./anchor";
import { SlashCommandMenu } from "./menu";
import { createInitialSlashCommandState, slashCommandReducer } from "./state";
import type { FeatureSlashCommand, SlashCommandSelection } from "./types";
import {
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
  const commandMeta = useMemo(
    () => commands.map((entry) => entry.command),
    [commands]
  );
  const [state, dispatch] = useReducer(
    slashCommandReducer,
    getFirstCommandId(commandMeta),
    createInitialSlashCommandState
  );
  const { isOpen, query, rawSelectedCommandId } = state;
  const commandListRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dismissedQueryRef = useRef<{ nodeKey: string; text: string } | null>(
    null
  );
  const activeQueryRef = useRef<{ nodeKey: string; text: string } | null>(null);

  const normalizedQuery = query.toLowerCase();
  const filteredEntries = normalizedQuery
    ? commands.filter(
        ({ command }) =>
          command.label.toLowerCase().includes(normalizedQuery) ||
          command.keywords.some((keyword) => keyword.includes(normalizedQuery))
      )
    : commands;
  const filteredCommands = filteredEntries.map((entry) => entry.command);

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

  const isMenuVisible = isOpen && filteredCommands.length > 0;

  const anchor = useMemo(() => createSlashMenuAnchor(editor), [editor]);

  const updateSlashMenu = () => {
    const selection = $getSelection();
    const isCollapsedRangeSelection =
      $isRangeSelection(selection) && selection.isCollapsed();

    if (!isCollapsedRangeSelection) {
      activeQueryRef.current = null;
      dismissedQueryRef.current = null;
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    const node = selection.anchor.getNode();
    if (!$isTextNode(node)) {
      activeQueryRef.current = null;
      dismissedQueryRef.current = null;
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    // Never open the slash menu inside code blocks (typing `//` or `/regex`).
    if ($isCodeNode(node) || $findMatchingParent(node, $isCodeNode)) {
      activeQueryRef.current = null;
      dismissedQueryRef.current = null;
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    // Only match when the slash starts the current block (no preceding sibling).
    if (node.getPreviousSibling() !== null) {
      activeQueryRef.current = null;
      dismissedQueryRef.current = null;
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    const textUpToCursor = node
      .getTextContent()
      .slice(0, selection.anchor.offset);
    const nextQuery = getSlashQueryMatch(textUpToCursor);

    if (nextQuery === null) {
      activeQueryRef.current = null;
      dismissedQueryRef.current = null;
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    const querySignature = { nodeKey: node.getKey(), text: textUpToCursor };
    activeQueryRef.current = querySignature;

    // If the user explicitly pressed Escape on this exact query, keep the menu
    // dismissed until they edit the text or move the caret elsewhere.
    if (
      dismissedQueryRef.current &&
      dismissedQueryRef.current.nodeKey === querySignature.nodeKey &&
      dismissedQueryRef.current.text === querySignature.text
    ) {
      return;
    }
    dismissedQueryRef.current = null;

    if (!getSelectionRectangle(editor)) {
      dispatch({ payload: { isOpen: false }, type: "patch" });
      return;
    }

    dispatch({
      payload: {
        firstCommandId: getFirstCommandId(commandMeta),
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
    dismissedQueryRef.current = null;
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
          dismissedQueryRef.current = activeQueryRef.current;
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
    dismissedQueryRef.current = null;
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
      isMenuVisible={isMenuVisible}
      onHoverCommand={handleHoverCommand}
      onSelectEntry={handleSelectEntry}
      selectedCommandId={selectedCommandId}
      selectedIndex={selectedIndex}
    />
  );
}
