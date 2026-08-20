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
import type { ChangeEvent } from "react";
import { useEffect, useEffectEvent, useReducer, useRef } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { ResolvedEditorFeatureFlags } from "../../core/composition";
import { INSERT_IMAGE_COMMAND } from "../image/commands";
import { readFileAsDataUrl } from "../image/utils";
import { INSERT_LAYOUT_COMMAND } from "../layout/commands";
import { INSERT_YOUTUBE_COMMAND } from "../youtube/commands";
import { parseYouTubeUrl } from "../youtube/utils";
import { createSlashMenuAnchor, getSelectionRectangle } from "./anchor";
import { getEnabledSlashCommands } from "./commands";
import { SLASH_COMMAND_EXECUTORS } from "./executors";
import { InsertImageDialog } from "./insert-image-dialog";
import { InsertYouTubeDialog } from "./insert-youtube-dialog";
import { SlashLayoutDialog } from "./layout-dialog";
import type {
  SlashCommand,
  SlashCommandId,
  SlashCommandSelection,
} from "./types";
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

interface SlashCommandPluginProps {
  features: ResolvedEditorFeatureFlags;
}

interface SlashCommandState {
  imageAltText: string;
  imageFileName: string;
  imageFileSrc: string | null;
  imageUrl: string;
  isImageDialogOpen: boolean;
  isLayoutPresetOpen: boolean;
  isOpen: boolean;
  isYouTubeDialogOpen: boolean;
  pendingImageTargetKey: string | null;
  pendingLayoutTargetKey: string | null;
  pendingYouTubeTargetKey: string | null;
  query: string;
  rawSelectedCommandId: SlashCommandSelection;
  youTubeUrl: string;
}

type SlashCommandAction =
  | { type: "patch"; payload: Partial<SlashCommandState> }
  | {
      type: "move-selected-command";
      payload: {
        commands: SlashCommand[];
        direction: "down" | "up";
      };
    }
  | {
      type: "set-image-file";
      payload: {
        fileName: string;
        src: string;
      };
    };

const createInitialSlashCommandState = (
  rawSelectedCommandId: SlashCommandSelection
): SlashCommandState => ({
  imageAltText: "",
  imageFileName: "",
  imageFileSrc: null,
  imageUrl: "",
  isImageDialogOpen: false,
  isLayoutPresetOpen: false,
  isOpen: false,
  isYouTubeDialogOpen: false,
  pendingImageTargetKey: null,
  pendingLayoutTargetKey: null,
  pendingYouTubeTargetKey: null,
  query: "",
  rawSelectedCommandId,
  youTubeUrl: "",
});

const applySlashCommandPatch = (
  state: SlashCommandState,
  patch: Partial<SlashCommandState>
): SlashCommandState => {
  for (const key of Object.keys(patch) as Array<keyof SlashCommandState>) {
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
          action.payload.commands,
          state.rawSelectedCommandId,
          action.payload.direction
        ),
      });
    }
    case "set-image-file": {
      return applySlashCommandPatch(state, {
        imageAltText: state.imageAltText || action.payload.fileName,
        imageFileName: action.payload.fileName,
        imageFileSrc: action.payload.src,
        imageUrl: "",
      });
    }
    default: {
      return state;
    }
  }
};

export function SlashCommandPlugin({ features }: SlashCommandPluginProps) {
  const [editor] = useLexicalComposerContext();
  const availableCommands = getEnabledSlashCommands(features);
  const [state, dispatch] = useReducer(
    slashCommandReducer,
    getFirstCommandId(availableCommands),
    createInitialSlashCommandState
  );
  const {
    imageAltText,
    imageFileName,
    imageFileSrc,
    imageUrl,
    isImageDialogOpen,
    isLayoutPresetOpen,
    isOpen,
    isYouTubeDialogOpen,
    pendingImageTargetKey,
    pendingLayoutTargetKey,
    pendingYouTubeTargetKey,
    query,
    rawSelectedCommandId,
    youTubeUrl,
  } = state;
  const commandListRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const filteredCommands = filterSlashCommands(availableCommands, query);

  const selectedCommandId: SlashCommandId | "" = (() => {
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
      dispatch({
        type: "patch",
        payload: { isLayoutPresetOpen: false, isOpen: false },
      });
      return;
    }

    const node = selection.anchor.getNode();
    if (!$isTextNode(node)) {
      dispatch({
        type: "patch",
        payload: { isLayoutPresetOpen: false, isOpen: false },
      });
      return;
    }

    const textUpToCursor = node
      .getTextContent()
      .slice(0, selection.anchor.offset);
    const nextQuery = getSlashQueryMatch(textUpToCursor);

    if (nextQuery === null) {
      dispatch({
        type: "patch",
        payload: { isLayoutPresetOpen: false, isOpen: false },
      });
      return;
    }

    if (!getSelectionRectangle(editor)) {
      dispatch({ type: "patch", payload: { isOpen: false } });
      return;
    }

    dispatch({
      type: "patch",
      payload: { isOpen: true, query: nextQuery },
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

  const resetImageDialog = () => {
    dispatch({
      type: "patch",
      payload: {
        imageAltText: "",
        imageFileName: "",
        imageFileSrc: null,
        imageUrl: "",
        isImageDialogOpen: false,
        pendingImageTargetKey: null,
      },
    });
  };

  const resetYouTubeDialog = () => {
    dispatch({
      type: "patch",
      payload: {
        isYouTubeDialogOpen: false,
        pendingYouTubeTargetKey: null,
        youTubeUrl: "",
      },
    });
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      dispatch({
        type: "patch",
        payload: { imageFileName: "", imageFileSrc: null },
      });
      return;
    }

    readFileAsDataUrl(file)
      .then((src) => {
        dispatch({
          type: "set-image-file",
          payload: { fileName: file.name, src },
        });
      })
      .catch(() => {
        dispatch({
          type: "patch",
          payload: { imageFileName: "", imageFileSrc: null },
        });
      });
  };

  const executeCommand = (commandId: SlashCommandId) => {
    if (
      commandId === "columns" ||
      commandId === "image" ||
      commandId === "youtube"
    ) {
      let targetNodeKey: string | null = null;

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        const node = selection.anchor.getNode();
        if (!$isTextNode(node)) {
          return;
        }

        targetNodeKey = node.getTopLevelElementOrThrow().getKey();
      });

      if (commandId === "columns") {
        dispatch({
          type: "patch",
          payload: {
            isLayoutPresetOpen: true,
            isOpen: false,
            pendingLayoutTargetKey: targetNodeKey,
          },
        });
      } else if (commandId === "youtube") {
        dispatch({
          type: "patch",
          payload: {
            isOpen: false,
            isYouTubeDialogOpen: true,
            pendingYouTubeTargetKey: targetNodeKey,
          },
        });
      } else {
        dispatch({
          type: "patch",
          payload: {
            isImageDialogOpen: true,
            isOpen: false,
            pendingImageTargetKey: targetNodeKey,
          },
        });
      }
      return;
    }

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

    dispatch({ type: "patch", payload: { isOpen: false } });
  };

  const executeLayoutPreset = (templateColumns: string) => {
    if (!pendingLayoutTargetKey) {
      return;
    }

    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, {
      targetNodeKey: pendingLayoutTargetKey,
      templateColumns,
    });

    dispatch({
      type: "patch",
      payload: {
        isLayoutPresetOpen: false,
        isOpen: false,
        pendingLayoutTargetKey: null,
      },
    });
  };

  const submitImage = () => {
    const nextImageSrc = imageFileSrc ?? imageUrl.trim();
    if (!(nextImageSrc && pendingImageTargetKey)) {
      return;
    }

    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText: imageAltText.trim(),
      src: nextImageSrc,
      targetNodeKey: pendingImageTargetKey,
    });

    dispatch({
      type: "patch",
      payload: {
        imageAltText: "",
        imageFileName: "",
        imageFileSrc: null,
        imageUrl: "",
        isImageDialogOpen: false,
        isOpen: false,
        pendingImageTargetKey: null,
      },
    });
  };

  const submitYouTube = () => {
    if (!pendingYouTubeTargetKey) {
      return;
    }

    const videoId = parseYouTubeUrl(youTubeUrl);
    if (!videoId) {
      return;
    }

    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, {
      targetNodeKey: pendingYouTubeTargetKey,
      videoId,
    });

    dispatch({
      type: "patch",
      payload: {
        isOpen: false,
        isYouTubeDialogOpen: false,
        pendingYouTubeTargetKey: null,
        youTubeUrl: "",
      },
    });
  };

  useEffect(() => {
    if (
      !(isOpen && selectedCommandId) ||
      isImageDialogOpen ||
      isLayoutPresetOpen ||
      isYouTubeDialogOpen
    ) {
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
  }, [
    isImageDialogOpen,
    isLayoutPresetOpen,
    isOpen,
    isYouTubeDialogOpen,
    selectedCommandId,
  ]);

  useEffect(() => {
    if (isImageDialogOpen || isLayoutPresetOpen || isYouTubeDialogOpen) {
      return;
    }

    return editor.registerUpdateListener(() => {
      scheduleSlashMenuUpdate();
    });
  }, [editor, isImageDialogOpen, isLayoutPresetOpen, isYouTubeDialogOpen]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
    };
  }, []);

  const onKeyCommand = useEffectEvent(
    (command: "arrow-down" | "arrow-up" | "enter" | "escape") => {
      const handleEnter = () => {
        if (isLayoutPresetOpen) {
          executeLayoutPreset("1fr 1fr");
          return;
        }

        if (isImageDialogOpen) {
          submitImage();
          return;
        }

        if (isYouTubeDialogOpen) {
          submitYouTube();
          return;
        }

        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          executeCommand(selectedCommand.id);
        }
      };

      const handleEscape = () => {
        if (isImageDialogOpen) {
          resetImageDialog();
          return;
        }

        if (isLayoutPresetOpen) {
          dispatch({
            type: "patch",
            payload: {
              isLayoutPresetOpen: false,
              pendingLayoutTargetKey: null,
            },
          });
          return;
        }

        if (isYouTubeDialogOpen) {
          resetYouTubeDialog();
          return;
        }

        dispatch({ type: "patch", payload: { isOpen: false } });
      };

      switch (command) {
        case "arrow-down": {
          dispatch({
            type: "move-selected-command",
            payload: { commands: filteredCommands, direction: "down" },
          });
          return;
        }
        case "arrow-up": {
          dispatch({
            type: "move-selected-command",
            payload: { commands: filteredCommands, direction: "up" },
          });
          return;
        }
        case "enter": {
          handleEnter();
          return;
        }
        case "escape": {
          handleEscape();
          return;
        }
        default: {
          return;
        }
      }
    }
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const isDialogOpen =
      isImageDialogOpen || isLayoutPresetOpen || isYouTubeDialogOpen;

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (isDialogOpen) {
            return true;
          }

          event.preventDefault();
          onKeyCommand("arrow-down");
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (isDialogOpen) {
            return true;
          }

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
  }, [
    editor,
    isOpen,
    isImageDialogOpen,
    isLayoutPresetOpen,
    isYouTubeDialogOpen,
  ]);

  return (
    <>
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
                "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 z-50 flex w-72 origin-(--transform-origin) flex-col overflow-hidden rounded-lg bg-popover p-0 text-popover-foreground text-sm shadow-md outline-hidden ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in"
              )}
              data-slot="slash-command-popover"
              finalFocus={false}
              initialFocus={false}
            >
              <Command
                onValueChange={(value) =>
                  dispatch({
                    type: "patch",
                    payload: { rawSelectedCommandId: value as SlashCommandId },
                  })
                }
                shouldFilter={false}
                value={selectedCommandId}
              >
                <CommandList ref={commandListRef}>
                  <CommandGroup heading="Blocks">
                    {filteredCommands.map((command, index) => (
                      <CommandItem
                        className={
                          index === selectedIndex
                            ? "bg-muted text-foreground"
                            : ""
                        }
                        key={command.id}
                        onMouseEnter={() =>
                          dispatch({
                            type: "patch",
                            payload: { rawSelectedCommandId: command.id },
                          })
                        }
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
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <SlashLayoutDialog
        onCancel={() => {
          dispatch({
            type: "patch",
            payload: {
              isLayoutPresetOpen: false,
              pendingLayoutTargetKey: null,
            },
          });
        }}
        onOpenChange={(open) =>
          dispatch({
            type: "patch",
            payload: open
              ? { isLayoutPresetOpen: true }
              : { isLayoutPresetOpen: false, pendingLayoutTargetKey: null },
          })
        }
        onSelectPreset={executeLayoutPreset}
        open={isLayoutPresetOpen}
      />

      <InsertImageDialog
        imageAltText={imageAltText}
        imageFileName={imageFileName}
        imageFileSrc={imageFileSrc}
        imageUrl={imageUrl}
        onAltTextChange={(value) =>
          dispatch({ type: "patch", payload: { imageAltText: value } })
        }
        onCancel={resetImageDialog}
        onImageFileChange={handleImageFileChange}
        onSubmit={submitImage}
        onUrlChange={(value) =>
          dispatch({ type: "patch", payload: { imageUrl: value } })
        }
        open={isImageDialogOpen}
      />

      <InsertYouTubeDialog
        onCancel={resetYouTubeDialog}
        onSubmit={submitYouTube}
        onUrlChange={(value) =>
          dispatch({ type: "patch", payload: { youTubeUrl: value } })
        }
        open={isYouTubeDialogOpen}
        youTubeUrl={youTubeUrl}
      />
    </>
  );
}
