import type { FloatingToolbarPosition } from "./types";

/** Minimum gap kept between the toolbar and the viewport edges. */
export const TOOLBAR_VIEWPORT_MARGIN = 8;

export interface ToolbarSize {
  height: number;
  width: number;
}

export interface ToolbarViewportSize {
  height: number;
  width: number;
}

/**
 * Keeps the selection-anchored toolbar fully inside the viewport. The
 * toolbar renders at the selection midpoint with `translate(-50%, -100%)`,
 * so its rendered box spans `[left - width/2, left + width/2]` horizontally
 * and `[top - height, top]` vertically. Without clamping, selections near
 * the browser edges push half the toolbar (or its full height) off screen.
 */
export const clampFloatingToolbarPosition = ({
  margin = TOOLBAR_VIEWPORT_MARGIN,
  position,
  toolbar,
  viewport,
}: {
  /** Gap between the toolbar and the viewport edge. */
  margin?: number;
  position: FloatingToolbarPosition;
  toolbar: ToolbarSize;
  viewport: ToolbarViewportSize;
}): FloatingToolbarPosition => {
  const halfWidth = toolbar.width / 2;
  const minLeft = halfWidth + margin;
  // When the viewport is narrower than the toolbar, both bounds collapse to
  // the left margin (best effort — the toolbar overflows either way).
  const maxLeft = Math.max(minLeft, viewport.width - halfWidth - margin);
  const minTop = toolbar.height + margin;

  return {
    left: Math.min(maxLeft, Math.max(minLeft, position.left)),
    top: Math.max(minTop, position.top),
  };
};
