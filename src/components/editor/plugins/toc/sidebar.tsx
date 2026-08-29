"use client";

import type { TableOfContentsEntry } from "@lexical/react/LexicalTableOfContentsPlugin";
import type { LexicalEditor, NodeKey } from "lexical";
import { AlignLeftIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useActiveHeading } from "./hooks";
import { EditorTableOfContentsPlugin } from "./plugin";

const DASH_WIDTHS: Record<string, string> = {
  h1: "w-5",
  h2: "w-4",
  h3: "w-3",
  h4: "w-2.5",
  h5: "w-2",
  h6: "w-1.5",
};

const INDENT_CLASSES: Record<string, string> = {
  h1: "pl-1",
  h2: "pl-3",
  h3: "pl-5",
  h4: "pl-7",
  h5: "pl-9",
  h6: "pl-11",
};

function EditorTocMiniBars({
  activeKey,
  entries,
  onHeadingClick,
}: {
  activeKey: NodeKey | null;
  entries: readonly TableOfContentsEntry[];
  onHeadingClick: (key: NodeKey) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-end gap-1 py-1 opacity-40">
        <span className="h-0.5 w-5 rounded-full bg-muted-foreground/40" />
        <span className="h-0.5 w-4 rounded-full bg-muted-foreground/40" />
        <span className="h-0.5 w-3 rounded-full bg-muted-foreground/40" />
      </div>
    );
  }

  return (
    // Height-capped and densified so heading-heavy documents keep the rail a
    // quiet outline affordance: compact gaps, thin dashes, overflow scrolled
    // via wheel/touch with the scrollbar itself hidden.
    <div className="scrollbar-hidden flex max-h-[45vh] flex-col items-end gap-1 overflow-y-auto py-1">
      {entries.map(([key, text, tag]) => {
        const isActive = key === activeKey;
        const widthClass = DASH_WIDTHS[tag] ?? "w-3";

        return (
          <button
            aria-label={`Jump to ${text.trim() || "heading"}`}
            className="group relative flex cursor-pointer items-center justify-end py-px outline-none"
            key={key}
            onClick={() => onHeadingClick(key)}
            type="button"
          >
            <span
              className={cn(
                "h-0.5 rounded-full transition-colors duration-150 ease-linear",
                widthClass,
                isActive
                  ? "bg-primary"
                  : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function EditorTocPopoverCard({
  activeKey,
  entries,
  onHeadingClick,
}: {
  activeKey: NodeKey | null;
  entries: readonly TableOfContentsEntry[];
  onHeadingClick: (key: NodeKey) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="fade-in-0 zoom-in-95 absolute top-0 right-0 z-50 flex min-w-[180px] animate-in flex-col items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-popover/95 px-4 py-5 text-center shadow-2xl backdrop-blur-md duration-150">
        <div className="flex size-6 items-center justify-center rounded-md bg-muted/20 text-muted-foreground/60">
          <AlignLeftIcon className="size-3.5" />
        </div>
        <p className="font-medium text-muted-foreground text-xs">
          No outline available
        </p>
      </div>
    );
  }

  return (
    <nav
      aria-label="Table of contents popover"
      className="fade-in-0 zoom-in-95 scrollbar-hidden relative top-0 right-0 z-50 max-h-[55vh] min-w-[200px] max-w-[260px] animate-in overflow-y-auto rounded-lg border border-border/50 bg-popover/95 p-2 shadow-2xl backdrop-blur-md duration-150"
    >
      <ul className="flex flex-col">
        {entries.map(([key, text, tag]) => {
          const headingText = text.trim() || "Untitled";
          const isActive = key === activeKey;
          const indentClass = INDENT_CLASSES[tag] ?? "pl-1";

          return (
            <li className="list-none" key={key}>
              <button
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1 text-left text-xs outline-none transition-colors duration-100 ease-linear",
                  indentClass,
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                )}
                onClick={() => onHeadingClick(key)}
                type="button"
              >
                <span className="truncate">{headingText}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EditorTableOfContentsInner({
  className,
  editor,
  entries,
}: {
  className?: string;
  editor: LexicalEditor;
  entries: readonly TableOfContentsEntry[];
}) {
  const { activeKey, handleHeadingClick } = useActiveHeading(entries, editor);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: hover popover container
    <aside
      aria-label="Table of contents outline"
      className={cn(
        "group relative flex select-none flex-col items-end",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovered ? (
        <EditorTocPopoverCard
          activeKey={activeKey}
          entries={entries}
          onHeadingClick={handleHeadingClick}
        />
      ) : (
        <EditorTocMiniBars
          activeKey={activeKey}
          entries={entries}
          onHeadingClick={handleHeadingClick}
        />
      )}
    </aside>
  );
}

export function EditorTableOfContents({ className }: { className?: string }) {
  return (
    <EditorTableOfContentsPlugin>
      {(entries, editor) => (
        <EditorTableOfContentsInner
          className={className}
          editor={editor}
          entries={entries}
        />
      )}
    </EditorTableOfContentsPlugin>
  );
}
