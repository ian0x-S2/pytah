"use client";

import type { LexicalEditor } from "lexical";
import {
  ExternalLinkIcon,
  Link2Icon,
  Trash2Icon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import type { KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  clearToolbarLink,
  submitToolbarLink,
  submitToolbarLinkText,
} from "../floating-toolbar/actions";
import { sanitizeEditorLinkUrl } from "./utils";

interface FloatingLinkEditorPanelProps {
  editedLinkText: string;
  editedLinkUrl: string;
  editor: LexicalEditor;
  inputRef: (element: HTMLInputElement | null) => void;
  /** When true the URL input is focused (explicit open via toolbar/Cmd+K). */
  isLinkEditMode: boolean;
  linkUrl: string;
  onEditedLinkTextChange: (value: string) => void;
  onEditedLinkUrlChange: (value: string) => void;
  onRequestCloseEditMode: () => void;
}

/**
 * Notion-style link card: link-text field, URL field and open/remove
 * actions in a single surface. Both fields are always editable — edit mode
 * only controls which input receives initial focus.
 */
export function FloatingLinkEditorPanel({
  editedLinkText,
  editedLinkUrl,
  editor,
  inputRef,
  isLinkEditMode,
  linkUrl,
  onEditedLinkTextChange,
  onEditedLinkUrlChange,
  onRequestCloseEditMode,
}: FloatingLinkEditorPanelProps) {
  const applyLink = () => {
    submitToolbarLink(editor, editedLinkUrl);
    submitToolbarLinkText(editor, editedLinkText);
    onRequestCloseEditMode();
  };

  const handleFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyLink();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onRequestCloseEditMode();
    }
  };

  return (
    <div
      className={cn(
        "editor-floating editor-floating-padding-md flex min-w-72 flex-col gap-2",
        "animate-in duration-100 fade-in-0 zoom-in-95"
      )}
    >
      <div className="flex items-center gap-2">
        <TypeIcon
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <Input
          aria-label="Link text"
          className="h-8 min-w-0 flex-1 text-xs"
          onChange={(event) => onEditedLinkTextChange(event.target.value)}
          onKeyDown={handleFieldKeyDown}
          placeholder="Link text"
          value={editedLinkText}
        />
      </div>
      <div className="flex items-center gap-2">
        <Link2Icon
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <Input
          aria-label="Link URL"
          className="h-8 min-w-0 flex-1 text-xs"
          onChange={(event) => onEditedLinkUrlChange(event.target.value)}
          onKeyDown={handleFieldKeyDown}
          placeholder="Add a link"
          ref={isLinkEditMode ? inputRef : undefined}
          value={editedLinkUrl}
        />
      </div>
      <div className="flex items-center justify-end gap-0.5">
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
          aria-label="Close link editor"
          onClick={onRequestCloseEditMode}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
