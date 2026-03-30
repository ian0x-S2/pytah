import type { FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FEATURE_ITEMS, WORD_SEPARATOR_PATTERN } from "./editor-constants";
import type { EditorSnapshot } from "./editor-types";

export function EditorShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-background/95 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EditorHeader() {
  return (
    <div className="border-border border-b bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {FEATURE_ITEMS.map((item) => (
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-muted-foreground text-xs"
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

export function EditorFooter({ snapshot }: { snapshot: EditorSnapshot }) {
  const trimmedText = snapshot.text.trim();
  const wordCount = trimmedText
    ? trimmedText.split(WORD_SEPARATOR_PATTERN).length
    : 0;
  const characterCount = snapshot.text.length;

  return (
    <div className="border-border border-t bg-muted/30 px-4 py-2 text-muted-foreground text-xs">
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
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-foreground text-sm">
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
