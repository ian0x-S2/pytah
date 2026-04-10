import type { LexicalEditor } from "lexical";
import {
  Edit3Icon,
  ExternalLinkIcon,
  Link2Icon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  clearToolbarLink,
  submitToolbarLink,
} from "../floating-toolbar/actions";
import { sanitizeEditorLinkUrl } from "./utils";

interface FloatingLinkEditorPanelProps {
  editedLinkUrl: string;
  editor: LexicalEditor;
  inputRef: RefObject<HTMLInputElement | null>;
  isLinkEditMode: boolean;
  linkUrl: string;
  onEditedLinkUrlChange: (value: string) => void;
  onRequestCloseEditMode: () => void;
  onRequestEditMode: () => void;
}

export function FloatingLinkEditorPanel({
  editedLinkUrl,
  editor,
  inputRef,
  isLinkEditMode,
  linkUrl,
  onEditedLinkUrlChange,
  onRequestCloseEditMode,
  onRequestEditMode,
}: FloatingLinkEditorPanelProps) {
  if (isLinkEditMode) {
    return (
      <div
        className={cn(
          "flex min-w-72 items-center gap-2 rounded-lg bg-popover p-2 shadow-md ring-1 ring-foreground/10",
          "fade-in-0 zoom-in-95 animate-in duration-100"
        )}
      >
        <Input
          className="h-8 min-w-56 text-xs"
          onChange={(event) => onEditedLinkUrlChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitToolbarLink(editor, editedLinkUrl);
              onRequestCloseEditMode();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              onRequestCloseEditMode();
            }
          }}
          ref={inputRef}
          value={editedLinkUrl}
        />
        <Button
          aria-label="Apply link"
          onClick={() => {
            submitToolbarLink(editor, editedLinkUrl);
            onRequestCloseEditMode();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Link2Icon />
        </Button>
        <Button
          aria-label="Cancel link editing"
          onClick={onRequestCloseEditMode}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-72 items-center gap-2 rounded-lg bg-popover p-2 shadow-md ring-1 ring-foreground/10",
        "fade-in-0 zoom-in-95 animate-in duration-100"
      )}
    >
      <a
        className="max-w-64 truncate text-primary text-xs underline underline-offset-4"
        href={sanitizeEditorLinkUrl(linkUrl)}
        rel="noopener noreferrer"
        target="_blank"
      >
        {linkUrl}
      </a>
      <Separator className="mx-0.5 h-4" orientation="vertical" />
      <Button
        aria-label="Edit link"
        onClick={onRequestEditMode}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <Edit3Icon />
      </Button>
      <Button
        aria-label="Remove link"
        onClick={() => {
          clearToolbarLink(editor);
          onRequestCloseEditMode();
        }}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <Trash2Icon />
      </Button>
      <Button
        aria-label="Open link in new tab"
        onClick={() => {
          window.open(
            sanitizeEditorLinkUrl(linkUrl),
            "_blank",
            "noopener,noreferrer"
          );
        }}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <ExternalLinkIcon />
      </Button>
    </div>
  );
}
