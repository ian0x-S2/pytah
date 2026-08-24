export type CornerDirection = "ne" | "nw" | "se" | "sw";
export type EdgeDirection = "e" | "n" | "s" | "w";
export type ResizeDirection = CornerDirection | EdgeDirection;

export interface ResizeState {
  currentHeight: number;
  currentWidth: number;
  direction: ResizeDirection;
  isResizing: boolean;
  ratio: number;
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
}

const MIN_WIDTH = 100;
const MIN_HEIGHT = 40;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isEast = (d: ResizeDirection) => d === "ne" || d === "se" || d === "e";

export const getCursor = (d: ResizeDirection) => {
  if (d === "n" || d === "s") {
    return "ns-resize";
  }

  if (d === "e" || d === "w") {
    return "ew-resize";
  }

  return d === "nw" || d === "se" ? "nwse-resize" : "nesw-resize";
};

/**
 * Computes the next box for a drag position. Corner drags stay width-driven
 * with locked aspect ratio; edge drags move one axis independently.
 */
export const computeNextSize = (
  positioning: ResizeState,
  clientX: number,
  clientY: number,
  zoom: number,
  maxWidthContainer: number
): { height: number; width: number } => {
  const dx = clientX / zoom - positioning.startX;
  const dy = clientY / zoom - positioning.startY;
  const { direction } = positioning;

  if (direction === "n" || direction === "s") {
    const delta = direction === "n" ? -dy : dy;
    return {
      height: clamp(
        positioning.startHeight + delta,
        MIN_HEIGHT,
        Number.MAX_SAFE_INTEGER
      ),
      width: positioning.startWidth,
    };
  }

  if (direction === "e" || direction === "w") {
    const delta = isEast(direction) ? dx : -dx;
    return {
      height: positioning.startHeight,
      width: clamp(
        positioning.startWidth + delta,
        MIN_WIDTH,
        maxWidthContainer
      ),
    };
  }

  const delta = isEast(direction) ? dx : -dx;
  const width = clamp(
    positioning.startWidth + delta,
    MIN_WIDTH,
    maxWidthContainer
  );
  return {
    height: width / positioning.ratio,
    width,
  };
};
