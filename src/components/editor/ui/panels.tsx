import { FileCode2Icon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorSnapshot } from "../core/types";
import { OutputPanel } from "./chrome";

interface EditorActionBarProps {
  className?: string;
  onLoadHtml: () => void;
  onLoadMarkdown: () => void;
  onReset: () => void;
}

export function EditorActionBar({
  className,
  onLoadHtml,
  onLoadMarkdown,
  onReset,
}: EditorActionBarProps) {
  return (
    <div
      className={cn("border-border border-b bg-muted/20 px-4 py-3", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onLoadMarkdown}
          size="sm"
          type="button"
          variant="outline"
        >
          <FileTextIcon />
          Load markdown
        </Button>
        <Button onClick={onLoadHtml} size="sm" type="button" variant="outline">
          <FileCode2Icon />
          Load HTML
        </Button>
        <Button onClick={onReset} size="sm" type="button" variant="ghost">
          Reset
        </Button>
      </div>
    </div>
  );
}

interface EditorOutputGridProps {
  className?: string;
  onCopyHtml: () => void;
  onCopyMarkdown: () => void;
  snapshot: EditorSnapshot;
}

export function EditorOutputGrid({
  className,
  onCopyHtml,
  onCopyMarkdown,
  snapshot,
}: EditorOutputGridProps) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <OutputPanel
        icon={FileTextIcon}
        label="Markdown output"
        onCopy={onCopyMarkdown}
        value={snapshot.markdown}
      />
      <OutputPanel
        icon={FileCode2Icon}
        label="HTML output"
        onCopy={onCopyHtml}
        value={snapshot.html}
      />
    </div>
  );
}
