import {
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

import type { WeblinkFormat } from "./types";

interface WeblinkFormatMenuProps {
  isLoading: boolean;
  onRefreshMetadata: () => void;
  onRemoveNode: () => void;
  onSetFormat: (format: WeblinkFormat) => void;
  showRefresh: boolean;
  url: string;
}

export function WeblinkFormatMenu({
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
            className="size-6 p-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:data-[state=open]:opacity-100"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <MoreHorizontalIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem onClick={() => onSetFormat("inline")}>
          <TypeIcon className="mr-2 size-3.5" />
          Inline link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSetFormat("small")}>
          <LayoutListIcon className="mr-2 size-3.5" />
          Small card
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSetFormat("wide")}>
          <Maximize2Icon className="mr-2 size-3.5" />
          Wide card
        </DropdownMenuItem>
        {showRefresh ? (
          <DropdownMenuItem
            disabled={isLoading}
            onClick={() => onRefreshMetadata()}
          >
            <RotateCwIcon
              className={cn("mr-2 size-3.5", isLoading && "animate-spin")}
            />
            {isLoading ? "Refreshing..." : "Refresh metadata"}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation();
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          <ExternalLinkIcon className="mr-2 size-3.5" />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemoveNode()}
        >
          <Trash2Icon className="mr-2 size-3.5" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
