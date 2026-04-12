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
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const availableCommands = useMemo(() => {
    return getEnabledSlashCommands(features);
  }, [features]);
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

  const filteredCommands = useMemo(() => {
    return filterSlashCommands(availableCommands, query);
  }, [availableCommands, query]);

  const selectedCommandId = useMemo<SlashCommandId | "">(() => {
    if (filteredCommands.length === 0) {
      return "";
    }

    return hasSelectedCommand(filteredCommands, rawSelectedCommandId)
      ? rawSelectedCommandId
      : getFirstCommandId(filteredCommands);
  }, [filteredCommands, rawSelectedCommandId]);

  const selectedIndex = useMemo(() => {
    return getSelectedCommandIndex(filteredCommands, selectedCommandId);
  }, [filteredCommands, selectedCommandId]);

  const anchor = useMemo(() => {
    return createSlashMenuAnchor(editor);
  }, [editor]);

  const updateSlashMenu = useCallback(() => {
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
  }, [editor]);

  const scheduleSlashMenuUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      editor.getEditorState().read(() => {
        updateSlashMenu();
      });
    });
  }, [editor, updateSlashMenu]);

  const resetImageDialog = useCallback(() => {
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
  }, []);

  const resetYouTubeDialog = useCallback(() => {
    dispatch({
      type: "patch",
      payload: {
        isYouTubeDialogOpen: false,
        pendingYouTubeTargetKey: null,
        youTubeUrl: "",
      },
    });
  }, []);

  const handleImageFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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
    },
    []
  );

  const executeCommand = useCallback(
    (commandId: SlashCommandId) => {
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
    },
    [editor]
  );

  const executeLayoutPreset = useCallback(
    (templateColumns: string) => {
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
    },
    [editor, pendingLayoutTargetKey]
  );

  const submitImage = useCallback(() => {
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
  }, [editor, imageAltText, imageFileSrc, imageUrl, pendingImageTargetKey]);

  const submitYouTube = useCallback(() => {
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
  }, [editor, pendingYouTubeTargetKey, youTubeUrl]);

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
  }, [
    editor,
    isImageDialogOpen,
    isLayoutPresetOpen,
    isYouTubeDialogOpen,
    scheduleSlashMenuUpdate,
  ]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleImageUrlInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      if (!(element && isImageDialogOpen)) {
        return;
      }

      element.focus();
    },
    [isImageDialogOpen]
  );

  const handleYouTubeUrlInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      if (!(element && isYouTubeDialogOpen)) {
        return;
      }

      element.focus();
    },
    [isYouTubeDialogOpen]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (isImageDialogOpen || isLayoutPresetOpen || isYouTubeDialogOpen) {
            return true;
          }

          event.preventDefault();
          dispatch({
            type: "move-selected-command",
            payload: { commands: filteredCommands, direction: "down" },
          });
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (isImageDialogOpen || isLayoutPresetOpen || isYouTubeDialogOpen) {
            return true;
          }

          event.preventDefault();
          dispatch({
            type: "move-selected-command",
            payload: { commands: filteredCommands, direction: "up" },
          });
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          event?.preventDefault();

          if (isLayoutPresetOpen) {
            executeLayoutPreset("1fr 1fr");
            return true;
          }

          if (isImageDialogOpen) {
            submitImage();
            return true;
          }

          if (isYouTubeDialogOpen) {
            submitYouTube();
            return true;
          }

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
          if (isImageDialogOpen) {
            resetImageDialog();
            return true;
          }

          if (isLayoutPresetOpen) {
            dispatch({
              type: "patch",
              payload: {
                isLayoutPresetOpen: false,
                pendingLayoutTargetKey: null,
              },
            });
            return true;
          }

          if (isYouTubeDialogOpen) {
            resetYouTubeDialog();
            return true;
          }

          dispatch({ type: "patch", payload: { isOpen: false } });
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [
    editor,
    executeCommand,
    executeLayoutPreset,
    filteredCommands,
    isImageDialogOpen,
    isLayoutPresetOpen,
    isOpen,
    isYouTubeDialogOpen,
    resetYouTubeDialog,
    resetImageDialog,
    selectedIndex,
    submitImage,
    submitYouTube,
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

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            resetImageDialog();
          }
        }}
        open={isImageDialogOpen}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Insert image</DialogTitle>
            <DialogDescription>
              Add an external image URL and optional alt text.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitImage();
            }}
          >
            <div className="grid gap-2">
              <label className="font-medium text-sm" htmlFor="slash-image-url">
                Image URL
              </label>
              <Input
                id="slash-image-url"
                onChange={(event) =>
                  dispatch({
                    type: "patch",
                    payload: { imageUrl: event.target.value },
                  })
                }
                placeholder="https://example.com/image.jpg"
                ref={handleImageUrlInputRef}
                type="url"
                value={imageUrl}
              />
            </div>

            <div className="grid gap-2">
              <label className="font-medium text-sm" htmlFor="slash-image-file">
                Local file
              </label>
              <Input
                accept="image/*"
                id="slash-image-file"
                onChange={handleImageFileChange}
                type="file"
              />
              {imageFileName ? (
                <p className="text-muted-foreground text-xs">
                  Selected: {imageFileName}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="font-medium text-sm" htmlFor="slash-image-alt">
                Alt text
              </label>
              <Textarea
                id="slash-image-alt"
                onChange={(event) =>
                  dispatch({
                    type: "patch",
                    payload: { imageAltText: event.target.value },
                  })
                }
                placeholder="Describe the image for accessibility"
                rows={3}
                value={imageAltText}
              />
            </div>

            <DialogFooter showCloseButton={false}>
              <Button
                onClick={resetImageDialog}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={!(imageFileSrc || imageUrl.trim())}
                type="submit"
              >
                Insert image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            resetYouTubeDialog();
          }
        }}
        open={isYouTubeDialogOpen}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Embed YouTube video</DialogTitle>
            <DialogDescription>
              Paste a YouTube URL and it will be embedded as a video block.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitYouTube();
            }}
          >
            <div className="grid gap-2">
              <label
                className="font-medium text-sm"
                htmlFor="slash-youtube-url"
              >
                YouTube URL
              </label>
              <Input
                id="slash-youtube-url"
                onChange={(event) =>
                  dispatch({
                    type: "patch",
                    payload: { youTubeUrl: event.target.value },
                  })
                }
                placeholder="https://www.youtube.com/watch?v=jNQXAC9IVRw"
                ref={handleYouTubeUrlInputRef}
                type="url"
                value={youTubeUrl}
              />
              <p className="text-muted-foreground text-xs">
                Supports `youtube.com`, `youtu.be`, and embed links.
              </p>
            </div>

            <DialogFooter showCloseButton={false}>
              <Button
                onClick={resetYouTubeDialog}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={!parseYouTubeUrl(youTubeUrl)} type="submit">
                Embed video
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
