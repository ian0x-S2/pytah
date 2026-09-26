"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  CODE_BLOCK_THEME_FAMILIES,
  isCodeBlockThemeFamily,
} from "./themes/registry";
import type { CodeBlockThemeFamily } from "./themes/registry";

interface CodeThemeSelectProps {
  className?: string;
  onValueChange: (value: CodeBlockThemeFamily) => void;
  value: CodeBlockThemeFamily;
}

/**
 * Controlled theme picker built on the Base UI `Select` primitive.
 * `value`/`onValueChange` carry the theme family (light/dark follows the
 * app theme); labels come from the theme registry. `className` overrides
 * the trigger (the visible element).
 */
export function CodeThemeSelect({
  className,
  onValueChange,
  value,
}: CodeThemeSelectProps) {
  return (
    <Select
      modal={false}
      onValueChange={(next) => {
        if (isCodeBlockThemeFamily(next) && next !== value) {
          onValueChange(next);
        }
      }}
      value={value}
    >
      <SelectTrigger
        aria-label="Code block theme"
        className={cn(
          "h-6 gap-1 rounded-md bg-muted/80 px-1.5 font-mono text-xs backdrop-blur-sm",
          className
        )}
        onMouseDown={(event) => {
          // Keep the editor caret where it is: the trigger lives outside
          // the editable root, but focusing it would still blur the editor
          // without preventing the default.
          event.preventDefault();
        }}
      >
        <SelectValue>
          {(selected: string | null) =>
            CODE_BLOCK_THEME_FAMILIES.find(
              (family) => family.value === selected
            )?.label ?? selected
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" side="bottom">
        {CODE_BLOCK_THEME_FAMILIES.map((family) => (
          <SelectItem key={family.value} value={family.value}>
            {family.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
