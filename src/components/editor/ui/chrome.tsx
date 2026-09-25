"use client";

import type { FileTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { FEATURE_ITEMS, WORD_SEPARATOR_PATTERN } from "../core/constants";
import type { EditorSnapshot } from "../core/types";

export function EditorShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("editor-shell shadow-sm", className)}>{children}</div>
  );
}

export function EditorHeader({ className }: { className?: string }) {
  return (
    <div className={cn("editor-header", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {FEATURE_ITEMS.map((item) => (
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
            key={item.label}
          >
            <item.icon className="size-3.5" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditorFooter({
  className,
  snapshot,
}: {
  className?: string;
  snapshot: EditorSnapshot;
}) {
  const trimmedText = snapshot.text.trim();
  const wordCount = trimmedText
    ? trimmedText.split(WORD_SEPARATOR_PATTERN).length
    : 0;
  const characterCount = snapshot.text.length;

  return (
    <div
      className={cn("editor-footer text-xs text-muted-foreground", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>{characterCount} chars</span>
          <span>Copy/paste ready HTML + Markdown</span>
        </div>
        <span>Use / to insert blocks</span>
      </div>
    </div>
  );
}

export function OutputPanel({
  icon: Icon,
  label,
  onCopy,
  value,
}: {
  icon: typeof FileTextIcon;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="editor-shell shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="size-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <Button onClick={onCopy} size="sm" type="button" variant="ghost">
          Copy
        </Button>
      </div>
      <Textarea
        className="min-h-55 rounded-none border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
        readOnly
        value={value}
      />
    </div>
  );
}
