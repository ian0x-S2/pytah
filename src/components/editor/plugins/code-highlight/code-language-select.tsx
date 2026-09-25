"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { CODE_BLOCK_LANGUAGES, getCodeLanguageLabel } from "./languages";

interface CodeLanguageSelectProps {
  className?: string;
  onValueChange: (value: string) => void;
  value: string;
}

/**
 * Controlled language picker built on the Base UI `Select` primitive.
 * `value`/`onValueChange` carry the canonical language id (what Lexical
 * persists on the `CodeNode`); labels come from the language registry.
 * `className` overrides the trigger (the visible element).
 */
export function CodeLanguageSelect({
  className,
  onValueChange,
  value,
}: CodeLanguageSelectProps) {
  return (
    <Select
      modal={false}
      onValueChange={(next) => {
        if (typeof next === "string" && next !== value) {
          onValueChange(next);
        }
      }}
      value={value}
    >
      <SelectTrigger
        aria-label="Code block language"
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
          {(selected: string | null) => getCodeLanguageLabel(selected)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" side="bottom">
        {CODE_BLOCK_LANGUAGES.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
