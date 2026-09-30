"use client";

import { ExternalLinkIcon, PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FloatingLinkPreviewChipProps {
  /** Sanitized href for the open-in-new-tab action. */
  href: string;
  label: string;
  onEdit: () => void;
}

/**
 * Google-Docs-style hover chip: page icon + link label + Edit. Purely a
 * preview surface — it never steals focus from the editor so hovering a
 * link while typing keeps the caret where it was.
 */
export function FloatingLinkPreviewChip({
  href,
  label,
  onEdit,
}: FloatingLinkPreviewChipProps) {
  return (
    <div
      className="editor-floating editor-floating-padding-sm flex max-w-96 items-center gap-1.5"
      data-slot="floating-link-preview"
    >
      <Button
        aria-label="Open link in new tab"
        className="size-5 shrink-0 gap-0 rounded-md p-0 [&_svg]:size-3"
        onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <ExternalLinkIcon />
      </Button>
      <span
        className="min-w-0 truncate text-xs text-muted-foreground"
        title={href}
      >
        {label}
      </span>
      <Button
        aria-label="Edit link"
        className="ml-auto shrink-0 gap-1 rounded-md px-1.5 text-xs [&_svg]:size-3"
        onClick={onEdit}
        size="icon-xs"
        type="button"
        variant="secondary"
      >
        <PencilIcon />
        Edit
      </Button>
    </div>
  );
}
