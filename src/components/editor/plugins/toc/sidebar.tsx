"use client";

import type { TableOfContentsEntry } from "@lexical/react/LexicalTableOfContentsPlugin";
import type { LexicalEditor, NodeKey } from "lexical";
import { cn } from "@/lib/utils";
import { useActiveHeading } from "./hooks";
import { EditorTableOfContentsPlugin } from "./plugin";
import { getHeadingStyle, scrollAndFocusHeading } from "./utils";

function EditorTableOfContentsItems({
  activeKey,
  className,
  editor,
  entries,
}: {
  activeKey: NodeKey | null;
  className?: string;
  editor: LexicalEditor;
  entries: readonly TableOfContentsEntry[];
}) {
  if (entries.length === 0) {
    return (
      <p className={cn("py-4 text-muted-foreground text-xs", className)}>
        Add headings to see the outline.
      </p>
    );
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <ul className="relative border-border/40 border-l">
        {entries.map(([key, text, tag]) => {
          const headingText = text.trim() || "Untitled";
          const style = getHeadingStyle(tag);
          const isActive = key === activeKey;

          return (
            <li key={key}>
              <button
                aria-current={isActive ? "true" : undefined}
                aria-label={`Jump to ${headingText}`}
                className={cn(
                  "relative block w-full truncate border-transparent border-l-2 py-1 pr-2 text-left leading-snug transition-all duration-150 ease-in-out",
                  style.indent,
                  style.size,
                  style.weight,
                  isActive
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  scrollAndFocusHeading(editor, key);
                }}
                type="button"
              >
                <span className="ml-3">
                  {headingText}
                  {isActive && (
                    <span className="sr-only"> (currently viewing)</span>
                  )}
                </span>
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
  const activeKey = useActiveHeading(entries, editor);

  return (
    <EditorTableOfContentsItems
      activeKey={activeKey}
      className={className}
      editor={editor}
      entries={entries}
    />
  );
}

export function EditorTableOfContents({ className }: { className?: string }) {
  return (
    <aside className={cn("w-56", className)}>
      <h2 className="mb-2 font-medium text-[11px] text-muted-foreground uppercase tracking-widest">
        On this page
      </h2>

      <EditorTableOfContentsPlugin>
        {(entries, editor) => (
          <EditorTableOfContentsInner
            className={className}
            editor={editor}
            entries={entries}
          />
        )}
      </EditorTableOfContentsPlugin>
    </aside>
  );
}
