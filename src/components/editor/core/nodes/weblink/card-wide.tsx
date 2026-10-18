import { ExternalLinkIcon } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { WeblinkIcon } from "./icon";

interface WeblinkWideCardProps {
  description?: string;
  domain: string;
  formatMenu: ReactNode;
  icon?: string;
  image?: string;
  isEditable: boolean;
  isLoading: boolean;
  title?: string;
  url: string;
}

export function WeblinkWideCard({
  description,
  domain,
  formatMenu,
  icon,
  image,
  isEditable,
  isLoading,
  title,
  url,
}: WeblinkWideCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isEditable && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
    }
  };

  return (
    <div
      className="group relative my-3 flex min-h-[96px] w-full flex-row items-stretch justify-between overflow-hidden rounded-md border border-border bg-card text-left text-foreground shadow-xs transition-colors select-none hover:bg-muted/30"
      data-slot="weblink-wide"
    >
      <a
        aria-label={`Open ${title || domain}`}
        className="absolute inset-0 z-0 rounded-md"
        href={url}
        onClick={handleLinkClick}
        rel="noopener noreferrer"
        target="_blank"
      />
      <div className="pointer-events-none relative z-0 flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate text-sm font-semibold text-foreground">
              {title || domain}
            </div>
            {formatMenu ? (
              <div className="pointer-events-auto relative z-10 shrink-0">
                {formatMenu}
              </div>
            ) : null}
          </div>
          {isLoading && !description ? (
            <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-muted-foreground/15" />
          ) : (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {description ||
                `Visit ${domain} to explore content and resources.`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
          <WeblinkIcon className="size-3.5 shrink-0 rounded-xs" icon={icon} />
          <span className="truncate">{domain}</span>
          <ExternalLinkIcon className="size-3 opacity-60 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div
        className={cn(
          "pointer-events-none relative z-0 hidden w-36 shrink-0 items-center justify-center border-l border-border bg-muted/20 sm:flex",
          isLoading && !image && "animate-pulse"
        )}
      >
        {image && !imageError ? (
          <img
            alt=""
            className="size-full object-cover"
            onError={() => setImageError(true)}
            src={image}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-muted-foreground/40">
            <WeblinkIcon className="size-7 opacity-30" icon={icon} />
            <span className="max-w-[120px] truncate font-mono text-xs tracking-wider uppercase opacity-60">
              {domain}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
