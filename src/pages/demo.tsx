import {
  BookOpenIcon,
  EyeIcon,
  MaximizeIcon,
  MinimizeIcon,
  PanelTopIcon,
  PencilIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/docs/theme-toggle";
import type { EditorToolbar } from "@/components/editor/core/types";
import { Editor } from "@/components/editor/editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOOLBAR_CYCLE: EditorToolbar[] = [false, "basic", "full"];

const TOOLBAR_LABELS: Record<string, string> = {
  basic: "Basic",
  full: "Full",
};

export function DemoPage() {
  const [editable, setEditable] = useState(true);
  const [zen, setZen] = useState(false);
  const [toolbar, setToolbar] = useState<EditorToolbar>(false);

  const cycleToolbar = () => {
    setToolbar((prev) => {
      const idx = TOOLBAR_CYCLE.indexOf(prev);
      return TOOLBAR_CYCLE[(idx + 1) % TOOLBAR_CYCLE.length];
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal navigation header */}
      <header
        className={cn(
          "sticky top-0 z-50 border-border border-b bg-background/80 backdrop-blur-sm transition-all",
          zen && "pointer-events-none opacity-0"
        )}
      >
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <Link
              className="font-semibold text-foreground text-sm tracking-tight"
              href="/"
            >
              Pytah
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-muted-foreground text-sm">Demo</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              className="gap-1.5"
              onClick={cycleToolbar}
              size="sm"
              variant={toolbar ? "secondary" : "ghost"}
            >
              <PanelTopIcon className="size-3.5" />
              {toolbar ? `Toolbar: ${TOOLBAR_LABELS[toolbar]}` : "Toolbar: Off"}
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => setEditable((prev) => !prev)}
              size="sm"
              variant="ghost"
            >
              {editable ? (
                <>
                  <EyeIcon className="size-3.5" /> Preview
                </>
              ) : (
                <>
                  <PencilIcon className="size-3.5" /> Edit
                </>
              )}
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => setZen((prev) => !prev)}
              size="sm"
              variant="ghost"
            >
              {zen ? (
                <>
                  <MinimizeIcon className="size-3.5" /> Exit
                </>
              ) : (
                <>
                  <MaximizeIcon className="size-3.5" /> Zen
                </>
              )}
            </Button>
            <Link href="/docs/getting-started">
              <Button className="gap-1.5" size="sm" variant="ghost">
                <BookOpenIcon className="size-3.5" /> Docs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Document page */}
      <main className="mx-auto w-full max-w-[720px] flex-1">
        {/* Notion-style page title */}
        {!zen && (
          <div className="px-8 pt-16 pb-4">
            <div className="mb-4 select-none text-5xl leading-none">📄</div>
            <h1 className="font-bold text-[40px] text-foreground leading-tight tracking-tight">
              Note Editor
            </h1>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Try slash commands, format text, add tables and images. Everything
              exports to clean HTML and Markdown.
            </p>
          </div>
        )}

        {/* Editor flows as the page body — no card, no border */}
        <div className={cn(zen && "pt-20")}>
          <Editor editable={editable} minimal toolbar={toolbar} />
        </div>
      </main>

      {/* Minimal footer */}
      {!zen && (
        <footer className="py-6 text-center text-muted-foreground/50 text-xs">
          Built with Lexical, shadcn, Base UI and Tailwind CSS v4
        </footer>
      )}
    </div>
  );
}
