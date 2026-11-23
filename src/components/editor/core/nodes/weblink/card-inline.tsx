import { ExternalLinkIcon } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

import { WeblinkIcon } from "./icon";

interface WeblinkInlineCardProps {
  domain: string;
  formatMenu?: ReactNode;
  icon?: string;
  isEditable: boolean;
  title?: string;
  url: string;
}

export function WeblinkInlineCard({
  domain,
  formatMenu,
  icon,
  isEditable,
  title,
  url,
}: WeblinkInlineCardProps) {
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isEditable && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
    }
  };

  return (
    <span
      className="group relative mx-0.5 inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-sm font-medium text-foreground transition-colors select-none hover:bg-muted"
      data-slot="weblink-inline"
    >
      <a
        className="inline-flex items-center gap-1.5 text-inherit no-underline"
        href={url}
        onClick={handleLinkClick}
        rel="noopener noreferrer"
        target="_blank"
        title={isEditable ? "Ctrl/Cmd+Click to open link" : undefined}
      >
        <WeblinkIcon className="size-3.5 shrink-0 rounded-xs" icon={icon} />
        <span className="max-w-[240px] truncate">{title || domain}</span>
        <ExternalLinkIcon
          aria-hidden
          className="size-3 text-muted-foreground transition-colors group-hover:text-foreground"
        />
      </a>
      {formatMenu}
    </span>
  );
}
