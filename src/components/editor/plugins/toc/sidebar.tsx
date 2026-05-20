"use client";

import type { TableOfContentsEntry } from "@lexical/react/LexicalTableOfContentsPlugin";
import type { LexicalEditor, NodeKey } from "lexical";
import { cn } from "@/lib/utils";
import { useActiveHeading } from "./hooks";
import { EditorTableOfContentsPlugin } from "./plugin";
import { getHeadingStyle } from "./utils";

function EditorTableOfContentsItems({
  activeKey,
  className,
  entries,
  selectedKey,
  onHeadingClick,
}: {
  activeKey: NodeKey | null;
  className?: string;
  entries: readonly TableOfContentsEntry[];
  selectedKey: NodeKey | null;
  onHeadingClick: (key: NodeKey) => void;
}) {
  if (entries.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 border-dashed bg-muted/5 px-4 py-8 text-center",
          className
        )}
      >
        <svg
          aria-hidden="true"
          className="size-5 text-muted-foreground/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="font-medium text-[11px] text-muted-foreground leading-none">
          No outline available
        </p>
        <p className="max-w-35 text-[10px] text-muted-foreground/60 leading-normal">
          Add headers to this page to see the outline structure.
        </p>
      </div>
    );
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <ul className="relative flex flex-col gap-0.5 border-border/30 border-l pl-0">
        {entries.map(([key, text, tag]) => {
          const headingText = text.trim() || "Untitled";
          const style = getHeadingStyle(tag);
          const isActive = key === activeKey;
          const isSelected = key === selectedKey;

          return (
            <li className="group relative list-none" key={key}>
              <button
                aria-current={isActive ? "true" : undefined}
                aria-label={`Jump to ${headingText}`}
                className={cn(
                  "relative block w-full select-none truncate border-transparent border-l-2 py-1.5 pr-2 text-left leading-snug outline-none transition-all duration-200 ease-out",
                  style.indent,
                  style.size,
                  isActive
                    ? "translate-x-0.5 border-primary bg-primary/5 font-medium text-primary dark:bg-primary/10"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted/30 hover:text-foreground",
                  isSelected && !isActive
                    ? "font-medium text-foreground/85"
                    : ""
                )}
                onClick={() => {
                  onHeadingClick(key);
                }}
                type="button"
              >
                <div className="flex items-center gap-1.5 pl-3">
                  {tag !== "h1" && (
                    <span
                      className={cn(
                        "size-1 shrink-0 rounded-full transition-all duration-200",
                        isActive
                          ? "scale-125 bg-primary shadow-[0_0_4px_rgba(var(--primary),0.6)]"
                          : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                      )}
                    />
                  )}
                  <span className="truncate">{headingText}</span>
                </div>
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
  const { activeKey, selectedKey, handleHeadingClick } = useActiveHeading(
    entries,
    editor
  );

  return (
    <EditorTableOfContentsItems
      activeKey={activeKey}
      className={className}
      entries={entries}
      onHeadingClick={handleHeadingClick}
      selectedKey={selectedKey}
    />
  );
}

export function EditorTableOfContents({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex w-60 select-none flex-col gap-3 rounded-xl border border-border/30 bg-background/60 p-4 shadow-md backdrop-blur-md dark:bg-zinc-950/40",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-border/40 border-b pb-2">
        <h2 className="flex items-center gap-1.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
          <svg
            aria-hidden="true"
            className="size-3.5 text-muted-foreground/80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 6h16M4 12h16M4 18h7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          On this page
        </h2>
        <span className="rounded-full border border-border/30 bg-muted/80 px-2 py-0.5 font-semibold text-[9px] text-muted-foreground/70 dark:bg-zinc-800/80">
          Outline
        </span>
      </div>

      <EditorTableOfContentsPlugin>
        {(entries, editor) => (
          <EditorTableOfContentsInner
            className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent max-h-[calc(100vh-280px)] flex-1 overflow-y-auto pr-1"
            editor={editor}
            entries={entries}
          />
        )}
      </EditorTableOfContentsPlugin>
    </aside>
  );
}
