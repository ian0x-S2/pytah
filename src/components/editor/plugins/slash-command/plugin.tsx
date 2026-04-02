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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { INSERT_IMAGE_COMMAND } from "../image/commands";
import { readFileAsDataUrl } from "../image/utils";
import { INSERT_LAYOUT_COMMAND } from "../layout/commands";
import { LAYOUT_PRESETS } from "../layout/constants";
import { INSERT_YOUTUBE_COMMAND } from "../youtube/commands";
import { parseYouTubeUrl } from "../youtube/utils";
import { SLASH_COMMANDS } from "./commands";
import { SLASH_COMMAND_EXECUTORS } from "./executors";
import type { SlashCommandId, SlashMenuAnchor } from "./types";
import {
  filterSlashCommands,
  getFirstCommandId,
  getNeighborCommandId,
  getSelectedCommandIndex,
  getSlashQueryMatch,
  hasSelectedCommand,
} from "./utils";

const TEMPLATE_COLUMN_SEPARATOR = /\s+/;
const SLASH_MENU_COLLISION_AVOIDANCE = {
  align: "none",
  fallbackAxisSide: "none",
  side: "flip",
} as const;

const getFirstTextDescendant = (element: HTMLElement): HTMLElement => {
  let inner = element;

  while (inner.firstElementChild instanceof HTMLElement) {
    inner = inner.firstElementChild;
  }

  return inner;
};

const getSelectionRectangle = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): DOMRect | null => {
  const nativeSelection = window.getSelection();
  const rootElement = editor.getRootElement();

  if (
    !(
      nativeSelection &&
      nativeSelection.rangeCount > 0 &&
      rootElement?.contains(nativeSelection.anchorNode)
    )
  ) {
    return null;
  }

  const range = nativeSelection.getRangeAt(0);
  const firstClientRect = range.getClientRects().item(0);
  const rectangle =
    nativeSelection.anchorNode === rootElement
      ? getFirstTextDescendant(rootElement).getBoundingClientRect()
      : (firstClientRect ?? range.getBoundingClientRect());
  const fallbackRectangle =
    nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
  const nextRectangle =
    rectangle.width === 0 && rectangle.height === 0 && fallbackRectangle
      ? fallbackRectangle
      : rectangle;

  if (nextRectangle.width === 0 && nextRectangle.height === 0) {
    return null;
  }

  return nextRectangle;
};

const createSlashMenuAnchor = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): SlashMenuAnchor => {
  return {
    getBoundingClientRect: () => {
      const rectangle = getSelectionRectangle(editor);

      if (!rectangle) {
        return new DOMRect();
      }

      return new DOMRect(
        rectangle.left,
        rectangle.top,
        Math.max(rectangle.width, 1),
        Math.max(rectangle.height, 1)
      );
    },
    getClientRects: () => {
      const rect = getSelectionRectangle(editor);

      if (!rect) {
        return {
          item: () => null,
          length: 0,
          [Symbol.iterator](): IterableIterator<DOMRect> {
            return [][Symbol.iterator]();
          },
        } as DOMRectList;
      }

      const anchorRect = new DOMRect(
        rect.left,
        rect.top,
        Math.max(rect.width, 1),
        Math.max(rect.height, 1)
      );

      return {
        0: anchorRect,
        item: (index: number) => {
          return index === 0 ? anchorRect : null;
        },
        length: 1,
        *[Symbol.iterator](): IterableIterator<DOMRect> {
          yield anchorRect;
        },
      } as DOMRectList;
    },
  };
};

const getLayoutPreviewColumns = (templateColumns: string) => {
  return templateColumns.split(TEMPLATE_COLUMN_SEPARATOR).filter(Boolean);
};

function LayoutPresetPreview({ templateColumns }: { templateColumns: string }) {
  const columns = getLayoutPreviewColumns(templateColumns);
  const columnOccurrences = new Map<string, number>();

  return (
    <div className="grid h-14 w-full gap-2 rounded-xl border border-border/70 bg-muted/40 p-2">
      <div
        className="grid h-full gap-2"
        style={{ gridTemplateColumns: templateColumns }}
      >
        {columns.map((column) => {
          const currentCount = columnOccurrences.get(column) ?? 0;
          columnOccurrences.set(column, currentCount + 1);

          return (
            <div
              className="rounded-md border border-border/70 bg-background/90 shadow-xs"
              key={`${templateColumns}-${column}-${currentCount}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [imageAltText, setImageAltText] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageFileSrc, setImageFileSrc] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isLayoutPresetOpen, setIsLayoutPresetOpen] = useState(false);
  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);
  const [pendingImageTargetKey, setPendingImageTargetKey] = useState<
    string | null
  >(null);
  const [pendingLayoutTargetKey, setPendingLayoutTargetKey] = useState<
    string | null
  >(null);
  const [pendingYouTubeTargetKey, setPendingYouTubeTargetKey] = useState<
    string | null
  >(null);
  const [query, setQuery] = useState("");
  const [selectedCommandId, setSelectedCommandId] = useState<
    SlashCommandId | ""
  >(getFirstCommandId(SLASH_COMMANDS));
  const [youTubeUrl, setYouTubeUrl] = useState("");
  const commandListRef = useRef<HTMLDivElement | null>(null);

  const filteredCommands = useMemo(() => {
    return filterSlashCommands(SLASH_COMMANDS, query);
  }, [query]);

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
      setIsOpen(false);
      setIsLayoutPresetOpen(false);
      return;
    }

    const node = selection.anchor.getNode();
    if (!$isTextNode(node)) {
      setIsOpen(false);
      setIsLayoutPresetOpen(false);
      return;
    }

    const textUpToCursor = node
      .getTextContent()
      .slice(0, selection.anchor.offset);
    const nextQuery = getSlashQueryMatch(textUpToCursor);

    if (nextQuery === null) {
      setIsOpen(false);
      setIsLayoutPresetOpen(false);
      return;
    }

    if (!getSelectionRectangle(editor)) {
      setIsOpen(false);
      return;
    }

    setQuery(nextQuery);
    setIsOpen(true);
  }, [editor]);

  const resetImageDialog = useCallback(() => {
    setImageAltText("");
    setImageFileName("");
    setImageFileSrc(null);
    setImageUrl("");
    setPendingImageTargetKey(null);
    setIsImageDialogOpen(false);
  }, []);

  const resetYouTubeDialog = useCallback(() => {
    setYouTubeUrl("");
    setPendingYouTubeTargetKey(null);
    setIsYouTubeDialogOpen(false);
  }, []);

  const handleImageFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        setImageFileName("");
        setImageFileSrc(null);
        return;
      }

      readFileAsDataUrl(file)
        .then((src) => {
          setImageAltText((currentAltText) => currentAltText || file.name);
          setImageFileName(file.name);
          setImageFileSrc(src);
          setImageUrl("");
        })
        .catch(() => {
          setImageFileName("");
          setImageFileSrc(null);
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
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }

          const node = selection.anchor.getNode();
          if (!$isTextNode(node)) {
            return;
          }

          const targetNodeKey = node.getTopLevelElementOrThrow().getKey();

          if (commandId === "columns") {
            setPendingLayoutTargetKey(targetNodeKey);
            return;
          }

          if (commandId === "youtube") {
            setPendingYouTubeTargetKey(targetNodeKey);
            return;
          }

          setPendingImageTargetKey(targetNodeKey);
        });

        if (commandId === "columns") {
          setIsLayoutPresetOpen(true);
        } else if (commandId === "youtube") {
          setIsYouTubeDialogOpen(true);
        } else {
          setIsImageDialogOpen(true);
        }

        setIsOpen(false);
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

      setIsOpen(false);
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

      setPendingLayoutTargetKey(null);
      setIsLayoutPresetOpen(false);
      setIsOpen(false);
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

    resetImageDialog();
    setIsOpen(false);
  }, [
    editor,
    imageAltText,
    imageFileSrc,
    imageUrl,
    pendingImageTargetKey,
    resetImageDialog,
  ]);

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

    resetYouTubeDialog();
    setIsOpen(false);
  }, [editor, pendingYouTubeTargetKey, resetYouTubeDialog, youTubeUrl]);

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
    if (
      !isOpen ||
      isImageDialogOpen ||
      isLayoutPresetOpen ||
      isYouTubeDialogOpen
    ) {
      return;
    }

    setSelectedCommandId(getFirstCommandId(filteredCommands));
  }, [
    filteredCommands,
    isImageDialogOpen,
    isLayoutPresetOpen,
    isOpen,
    isYouTubeDialogOpen,
  ]);

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

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateSlashMenu();
      });
    });
  }, [
    editor,
    isImageDialogOpen,
    isLayoutPresetOpen,
    isYouTubeDialogOpen,
    updateSlashMenu,
  ]);

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
          if (isImageDialogOpen || isLayoutPresetOpen || isYouTubeDialogOpen) {
            return true;
          }

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

          if (isLayoutPresetOpen) {
            executeLayoutPreset(LAYOUT_PRESETS[0]?.value ?? "1fr 1fr");
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
            setIsLayoutPresetOpen(false);
            return true;
          }

          if (isYouTubeDialogOpen) {
            resetYouTubeDialog();
            return true;
          }

          setIsOpen(false);
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
                  setSelectedCommandId(value as SlashCommandId)
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
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <Dialog onOpenChange={setIsLayoutPresetOpen} open={isLayoutPresetOpen}>
        <DialogContent
          className="max-h-[calc(100vh-2rem)] overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton
        >
          <DialogHeader className="px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
            <DialogTitle>Choose columns layout</DialogTitle>
            <DialogDescription>
              Pick one of the official Lexical-style column presets.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(70vh,34rem)] overflow-y-auto px-4 pt-2 pb-4 sm:px-6 sm:pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {LAYOUT_PRESETS.map((preset) => (
                <Button
                  className="h-auto min-h-32 justify-start rounded-2xl border border-border/80 px-4 py-4 text-left hover:bg-muted/60"
                  key={preset.value}
                  onClick={() => executeLayoutPreset(preset.value)}
                  type="button"
                  variant="ghost"
                >
                  <span className="flex w-full flex-col items-start gap-3">
                    <LayoutPresetPreview templateColumns={preset.value} />
                    <span className="flex flex-col items-start gap-1">
                      <span className="font-medium text-foreground text-sm">
                        {preset.label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {preset.description}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground/80">
                        {preset.value}
                      </span>
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter
            className="mt-0 px-4 py-3 sm:px-6"
            showCloseButton={false}
          >
            <Button
              onClick={() => {
                setPendingLayoutTargetKey(null);
                setIsLayoutPresetOpen(false);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                executeLayoutPreset(LAYOUT_PRESETS[0]?.value ?? "1fr 1fr")
              }
              type="button"
            >
              Use default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                autoFocus
                id="slash-image-url"
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
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
                onChange={(event) => setImageAltText(event.target.value)}
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
                autoFocus
                id="slash-youtube-url"
                onChange={(event) => setYouTubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=jNQXAC9IVRw"
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
