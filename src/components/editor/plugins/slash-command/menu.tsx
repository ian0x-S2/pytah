"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { LexicalEditor } from "lexical";
import type { RefObject } from "react";
import { useRef } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import type {
  FeatureSlashCommand,
  SlashCommandSelection,
  SlashMenuAnchor,
} from "./types";

const SLASH_MENU_COLLISION_AVOIDANCE = {
  align: "none",
  fallbackAxisSide: "none",
  side: "flip",
} as const;

interface SlashCommandMenuProps {
  anchor: SlashMenuAnchor;
  commandListRef: RefObject<HTMLDivElement | null>;
  editor: LexicalEditor;
  filteredEntries: readonly FeatureSlashCommand[];
  hasResults: boolean;
  isMenuVisible: boolean;
  onHoverCommand: (id: SlashCommandSelection) => void;
  onSelectEntry: (entry: FeatureSlashCommand) => void;
  selectedCommandId: SlashCommandSelection;
  selectedIndex: number;
}

/**
 * Floating slash-menu surface: popover positioning plus the cmdk list.
 * State, keyboard handling and scroll-into-view stay in the plugin so this
 * component only maps entries to items.
 */
export function SlashCommandMenu({
  anchor,
  commandListRef,
  editor,
  filteredEntries,
  hasResults,
  isMenuVisible,
  onHoverCommand,
  onSelectEntry,
  selectedCommandId,
  selectedIndex,
}: SlashCommandMenuProps) {
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <PopoverPrimitive.Root modal={false} open={isMenuVisible}>
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
              "z-50 flex w-72 origin-(--transform-origin) flex-col overflow-hidden rounded-md bg-popover p-0 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
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

                          onHoverCommand(command.id);
                        }}
                        onSelect={() => {
                          onSelectEntry(entry);
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
                {hasResults ? null : (
                  <CommandEmpty>No results found</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
