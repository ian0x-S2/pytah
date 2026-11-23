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
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { applyToolbarLink, clearToolbarLink } from "./actions";
import { sanitizeEditorLinkUrl } from "./utils";

interface FloatingLinkEditorPanelProps {
  editedLinkText: string;
  editedLinkUrl: string;
  editor: LexicalEditor;
  inputRef: (element: HTMLInputElement | null) => void;
  /** When true the URL input receives focus (explicit open via toolbar/Cmd+K). */
  isLinkEditMode: boolean;
  linkUrl: string;
  onEditedLinkTextChange: (value: string) => void;
  onEditedLinkUrlChange: (value: string) => void;
  /** Applies and closes the card. Escape/outside-press are owned by the Popover. */
  onRequestClose: () => void;
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
  onRequestClose,
}: FloatingLinkEditorPanelProps) {
  const [urlError, setUrlError] = useState<string | null>(null);

  const applyLink = () => {
    const applied = applyToolbarLink(editor, editedLinkUrl, editedLinkText);
    if (!applied) {
      setUrlError("Enter a valid URL");
      return;
    }

    setUrlError(null);
    onRequestClose();
  };

  const handleFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyLink();
    }
  };

  const textInputId = useId();
  const urlInputId = useId();
  const urlErrorId = useId();

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="grid gap-1">
        <label
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          htmlFor={textInputId}
        >
          <TypeIcon aria-hidden className="size-3 shrink-0" />
          Text
        </label>
        <Input
          className="h-8 min-w-0 flex-1 text-xs"
          id={textInputId}
          onChange={(event) => onEditedLinkTextChange(event.target.value)}
          onKeyDown={handleFieldKeyDown}
          placeholder="Link text"
          value={editedLinkText}
        />
      </div>
      <div className="grid gap-1">
        <label
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          htmlFor={urlInputId}
        >
          <Link2Icon aria-hidden className="size-3 shrink-0" />
          Link
        </label>
        <Input
          aria-describedby={urlError ? urlErrorId : undefined}
          aria-invalid={urlError !== null}
          className="h-8 min-w-0 flex-1 text-xs"
          id={urlInputId}
          inputMode="url"
          onChange={(event) => {
            if (urlError !== null) {
              setUrlError(null);
            }
            onEditedLinkUrlChange(event.target.value);
          }}
          onKeyDown={handleFieldKeyDown}
          placeholder="Add a link"
          ref={isLinkEditMode ? inputRef : undefined}
          type="url"
          value={editedLinkUrl}
        />
        {urlError ? (
          <p className="text-xs text-destructive" id={urlErrorId} role="alert">
            {urlError}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-0.5 pt-2">
        <Button
          aria-label="Open link in new tab"
          nativeButton={false}
          render={
            <a
              aria-label="Open link in new tab"
              href={sanitizeEditorLinkUrl(linkUrl)}
              rel="noopener noreferrer"
              target="_blank"
            />
          }
          size="icon-xs"
          variant="ghost"
        >
          <ExternalLinkIcon aria-hidden />
        </Button>
        <Button
          aria-label="Remove link"
          onClick={() => {
            clearToolbarLink(editor);
            onRequestClose();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2Icon aria-hidden />
        </Button>
        <Button
          aria-label="Close link editor"
          onClick={onRequestClose}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon aria-hidden />
        </Button>
      </div>
    </div>
  );
}
