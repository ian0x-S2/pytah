"use client";

import { Fragment } from "react";
import type { RefObject } from "react";

import { cn } from "@/lib/utils";

import { LINK_PASTE_OPTIONS } from "./constants";
import type { LinkPasteOptionId } from "./constants";

interface FloatingLinkPasteItemsProps {
  itemRefs: RefObject<(HTMLButtonElement | null)[]>;
  menuId: string;
  onNavigate: (index: number, shouldFocus: boolean) => void;
  onSelectOption: (optionId: LinkPasteOptionId) => void;
  selectedIndex: number;
}

const getOptionClassName = (isSelected: boolean, isDestructive: boolean) => {
  if (isSelected) {
    return isDestructive
      ? "bg-destructive/15 text-destructive"
      : "bg-accent text-accent-foreground";
  }

  return isDestructive
    ? "text-destructive hover:bg-destructive/10"
    : "text-foreground hover:bg-accent/60";
};

export function FloatingLinkPasteItems({
  itemRefs,
  menuId,
  onNavigate,
  onSelectOption,
  selectedIndex,
}: FloatingLinkPasteItemsProps) {
  return (
    <>
      {LINK_PASTE_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isSelected = index === selectedIndex;
        const isDestructive = option.id === "remove-link";

        return (
          <Fragment key={option.id}>
            {isDestructive ? (
              <div aria-hidden="true" className="-mx-1 my-0.5 h-px bg-border" />
            ) : null}
            <button
              ref={(el) => {
                if (itemRefs.current) {
                  itemRefs.current[index] = el;
                }
              }}
              className={cn(
                "flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-2.5 text-left text-xs font-medium outline-hidden transition-colors focus:outline-hidden",
                getOptionClassName(isSelected, isDestructive)
              )}
              id={`${menuId}-item-${index}`}
              onClick={() => onSelectOption(option.id)}
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onPointerEnter={() => onNavigate(index, false)}
              role="menuitem"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  isDestructive ? "text-destructive" : "text-muted-foreground"
                )}
              />
              <span>{option.label}</span>
            </button>
          </Fragment>
        );
      })}
    </>
  );
}
