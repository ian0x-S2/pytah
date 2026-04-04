"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COLOR_PALETTE, type ColorSwatch } from "../core/colors";

interface ColorSwatchesProps {
  /** Currently active color value (hex). Empty string means no color. */
  activeColor: string;
  className?: string;
  /** Icon rendered inside the trigger button. */
  icon: LucideIcon;
  /** Accessible label for the trigger button. */
  label: string;
  /** Called with the selected hex value, or "" when the user clears. */
  onColorChange: (color: string) => void;
  /** Notified when the popover opens/closes — useful to prevent the parent
   *  floating toolbar from hiding while the picker is in use. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Override the default palette.  Changing this prop (or editing
   * `src/components/editor/core/colors.ts`) is the intended customisation
   * surface for developers.
   */
  palette?: ColorSwatch[];
}

export function ColorSwatches({
  activeColor,
  icon: Icon,
  label,
  onColorChange,
  onOpenChange,
  palette = COLOR_PALETTE,
  className,
}: ColorSwatchesProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleSelect = (color: string) => {
    onColorChange(color);
    handleOpenChange(false);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      {/*
       * onMouseDown is prevented so that clicking the trigger does not move
       * focus away from the editor — the Lexical selection is preserved and
       * the color is applied to the correct range.
       */}
      <PopoverTrigger
        className={cn(className)}
        onMouseDown={(e) => e.preventDefault()}
        render={
          <Button
            aria-label={label}
            className="flex-col gap-0.5"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <Icon aria-hidden className="size-3.5 shrink-0" />
        {/* Thin color bar indicates the currently active color */}
        <div
          aria-hidden
          className="h-0.5 w-3.5 rounded-full transition-colors"
          style={{
            backgroundColor: activeColor || "transparent",
            outline: activeColor ? undefined : "1px dashed hsl(var(--border))",
            outlineOffset: "-1px",
          }}
        />
      </PopoverTrigger>

      {/*
       * onMouseDown is also prevented here so that clicking any swatch
       * button keeps focus in the editor instead of moving it to the popup.
       */}
      <PopoverContent
        className="w-auto rounded-xl p-2 ring-border"
        onMouseDown={(e) => e.preventDefault()}
        side="bottom"
        sideOffset={6}
      >
        <div className="grid grid-cols-4 gap-1">
          {palette.map((swatch) => (
            <button
              aria-label={swatch.label}
              className={cn(
                "size-6 rounded-md border border-border/40 transition-transform hover:scale-110",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                activeColor === swatch.value &&
                  "ring-2 ring-primary ring-offset-1"
              )}
              key={swatch.value}
              onClick={() => handleSelect(swatch.value)}
              style={{ backgroundColor: swatch.value }}
              title={swatch.label}
              type="button"
            />
          ))}
        </div>

        <div className="mt-1.5 border-border border-t pt-1.5">
          <button
            className="w-full rounded-md px-2 py-1 text-center text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => handleSelect("")}
            type="button"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
