import {
  CheckIcon,
  ExternalLinkIcon,
  LayoutListIcon,
  Maximize2Icon,
  MoreHorizontalIcon,
  RotateCwIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { sanitizeHrefUrl } from "../../url";
import type { WeblinkFormat } from "./types";

interface WeblinkFormatMenuProps {
  currentFormat: WeblinkFormat;
  isLoading: boolean;
  onRefreshMetadata: () => void;
  onRemoveNode: () => void;
  onSetFormat: (format: WeblinkFormat) => void;
  showRefresh: boolean;
  url: string;
}

const ACTIVE_CHECK_CLASS =
  "ml-auto size-3.5 shrink-0 self-center text-muted-foreground";

export function WeblinkFormatMenu({
  currentFormat,
  isLoading,
  onRefreshMetadata,
  onRemoveNode,
  onSetFormat,
  showRefresh,
  url,
}: WeblinkFormatMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(event) => {
          event.stopPropagation();
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        render={
          <Button
            aria-label="Weblink options"
            className="size-6 p-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:data-[popup-open]:opacity-100"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <MoreHorizontalIcon aria-hidden className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem onClick={() => onSetFormat("inline")}>
          <TypeIcon aria-hidden className="mr-2 size-3.5" />
          Inline link
          {currentFormat === "inline" ? (
            <CheckIcon aria-hidden className={ACTIVE_CHECK_CLASS} />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSetFormat("small")}>
          <LayoutListIcon aria-hidden className="mr-2 size-3.5" />
          Small card
          {currentFormat === "small" ? (
            <CheckIcon aria-hidden className={ACTIVE_CHECK_CLASS} />
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSetFormat("wide")}>
          <Maximize2Icon aria-hidden className="mr-2 size-3.5" />
          Wide card
          {currentFormat === "wide" ? (
            <CheckIcon aria-hidden className={ACTIVE_CHECK_CLASS} />
          ) : null}
        </DropdownMenuItem>
        {showRefresh ? (
          <DropdownMenuItem
            disabled={isLoading}
            onClick={() => onRefreshMetadata()}
          >
            <RotateCwIcon
              aria-hidden
              className={cn("mr-2 size-3.5", isLoading && "animate-spin")}
            />
            {isLoading ? "Refreshing..." : "Refresh metadata"}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            const safeUrl = sanitizeHrefUrl(url);
            if (safeUrl !== "about:blank") {
              window.open(safeUrl, "_blank", "noopener,noreferrer");
            }
          }}
        >
          <ExternalLinkIcon aria-hidden className="mr-2 size-3.5" />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemoveNode()}
        >
          <Trash2Icon aria-hidden className="mr-2 size-3.5" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
