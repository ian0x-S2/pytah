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
      className="editor-floating editor-floating-no-ring editor-floating-padding-sm flex max-w-[min(24rem,calc(100vw-2rem))] items-center gap-1"
      data-slot="floating-link-preview"
    >
      <Button
        aria-label="Open link in new tab"
        render={
          <a
            aria-label="Open link in new tab"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          />
        }
        size="icon-xs"
        variant="ghost"
      >
        <ExternalLinkIcon />
      </Button>
      <span
        className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
        title={href}
      >
        {label}
      </span>
      <Button
        aria-label="Edit link"
        className="gap-1 text-xs"
        onClick={onEdit}
        size="xs"
        type="button"
        variant="secondary"
      >
        <PencilIcon />
        Edit
      </Button>
    </div>
  );
}
