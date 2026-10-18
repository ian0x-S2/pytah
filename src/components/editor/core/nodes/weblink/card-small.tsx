import { ExternalLinkIcon } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

import { WeblinkIcon } from "./icon";

interface WeblinkSmallCardProps {
  description?: string;
  domain: string;
  formatMenu: ReactNode;
  icon?: string;
  isEditable: boolean;
  isLoading: boolean;
  title?: string;
  url: string;
}

export function WeblinkSmallCard({
  description,
  domain,
  formatMenu,
  icon,
  isEditable,
  isLoading,
  title,
  url,
}: WeblinkSmallCardProps) {
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isEditable && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
    }
  };

  return (
    <div
      className="group relative my-2 flex max-w-[360px] items-center justify-between gap-3 rounded-md border border-border bg-card p-3 text-left text-foreground shadow-xs transition-colors select-none hover:bg-muted/30"
      data-slot="weblink-small"
    >
      <a
        aria-label={`Open ${title || domain}`}
        className="absolute inset-0 z-0 rounded-md"
        href={url}
        onClick={handleLinkClick}
        rel="noopener noreferrer"
        target="_blank"
      />
      <div className="pointer-events-none relative z-0 flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-muted/60">
          <WeblinkIcon className="size-4 rounded-xs" icon={icon} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {title || domain}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {isLoading && !description ? "Loading preview..." : domain}
          </div>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-0.5">
        {formatMenu}
        <div className="pointer-events-none p-1">
          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </div>
  );
}
