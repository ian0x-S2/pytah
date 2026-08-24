"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarTooltipProps {
  /** The toolbar control (Button/Toggle) that triggers the tooltip. */
  children: React.ReactElement;
  /** Text shown inside the tooltip. */
  label: string;
}

/**
 * Wraps an icon-only toolbar control with a tooltip. The child is rendered
 * through Base UI's `render` prop so the DOM stays a single interactive
 * element — no nested buttons. Mount a `TooltipProvider` around the toolbar
 * to control the open delay for the whole group.
 */
export function ToolbarTooltip({ children, label }: ToolbarTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
