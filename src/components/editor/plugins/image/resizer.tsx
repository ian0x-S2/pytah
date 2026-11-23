"use client";

import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { useEffect, useLayoutEffect, useRef } from "react";

import { computeNextSize, getCursor } from "./resize-geometry";
import type {
  CornerDirection,
  EdgeDirection,
  ResizeDirection,
  ResizeState,
} from "./resize-geometry";

interface ImageResizerProps {
  /**
   * Absolutely-positioned chrome (action buttons and the like) rendered
   * inside the bounds-synced overlay. Because the overlay tracks the
   * resized element's true box, decorations stay glued to its corners and
   * edges even when ancestor containers clamp the element's layout width.
   */
  decorations?: React.ReactNode;
  /**
   * Also render edge handles that resize a single axis freely. Corners keep
   * the aspect-ratio-locked behavior; opt in for blocks like drawings where
   * width and height are independent.
   */
  edgeHandles?: boolean;
  editor: LexicalEditor;
  /** Element being resized; any element with box dimensions works. */
  imageRef: { current: HTMLElement | null };
  maxWidth?: number;
  onResizeEnd: (width: number, height: number) => void;
  onResizeStart: () => void;
}

const MIN_MAX_WIDTH = 100;
const CORNER_DIRECTIONS: CornerDirection[] = ["ne", "se", "sw", "nw"];
const EDGE_DIRECTIONS: EdgeDirection[] = ["n", "e", "s", "w"];

const DIRECTION_LABELS: Record<ResizeDirection, string> = {
  e: "Resize from right edge",
  n: "Resize from top edge",
  ne: "Resize from top-right corner",
  nw: "Resize from top-left corner",
  s: "Resize from bottom edge",
  se: "Resize from bottom-right corner",
  sw: "Resize from bottom-left corner",
  w: "Resize from left edge",
};

const CORNER_CLASSES: Record<CornerDirection, string> = {
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
};

const EDGE_CLASSES: Record<EdgeDirection, string> = {
  e: "right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  w: "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2",
};

/** Edge handles are bars perpendicular to the axis they resize. */
const EDGE_BAR_CLASSES: Record<EdgeDirection, string> = {
  e: "h-6 w-1 cursor-ew-resize",
  n: "h-1 w-6 cursor-ns-resize",
  s: "h-1 w-6 cursor-ns-resize",
  w: "h-6 w-1 cursor-ew-resize",
};

/**
 * Corner and edge handles rendered in an overlay that mirrors the resized
 * element's true box, so handles stay glued to it even when ancestor
 * containers clamp its layout width.
 */
export function ImageResizer({
  decorations,
  editor,
  imageRef,
  maxWidth,
  onResizeEnd,
  onResizeStart,
  edgeHandles = false,
}: ImageResizerProps) {
  const controlWrapperRef = useRef<HTMLDivElement | null>(null);
  const maxWidthContainerRef = useRef<number>(MIN_MAX_WIDTH);
  const cleanupActiveResizeRef = useRef<(() => void) | null>(null);
  const userSelect = useRef({ priority: "", value: "default" });
  const positioningRef = useRef<ResizeState>({
    currentHeight: 0,
    currentWidth: 0,
    direction: "se",
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });

  useLayoutEffect(() => {
    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (!(image && controlWrapper)) {
      return;
    }

    const syncBounds = () => {
      controlWrapper.style.left = `${image.offsetLeft}px`;
      controlWrapper.style.top = `${image.offsetTop}px`;
      controlWrapper.style.width = `${image.offsetWidth}px`;
      controlWrapper.style.height = `${image.offsetHeight}px`;
    };

    syncBounds();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(syncBounds);
    observer.observe(image);
    const { offsetParent } = image;
    if (offsetParent) {
      observer.observe(offsetParent);
    }
    return () => observer.disconnect();
  }, [imageRef]);

  useEffect(
    () => () => {
      cleanupActiveResizeRef.current?.();
      cleanupActiveResizeRef.current = null;
    },
    []
  );

  const resolveMaxWidthContainer = (): number => {
    if (maxWidth && maxWidth > 0) {
      return Math.max(MIN_MAX_WIDTH, maxWidth);
    }
    const editorRootElement = editor.getRootElement();
    if (editorRootElement) {
      return Math.max(
        MIN_MAX_WIDTH,
        editorRootElement.getBoundingClientRect().width - 20
      );
    }
    return MIN_MAX_WIDTH;
  };

  const setStartCursor = (direction: ResizeDirection) => {
    const cursor = getCursor(direction);
    editor.getRootElement()?.style.setProperty("cursor", cursor, "important");
    document.body.style.setProperty("cursor", cursor, "important");
    userSelect.current.value = document.body.style.getPropertyValue(
      "-webkit-user-select"
    );
    userSelect.current.priority = document.body.style.getPropertyPriority(
      "-webkit-user-select"
    );
    document.body.style.setProperty("-webkit-user-select", "none", "important");
  };

  const setEndCursor = () => {
    editor.getRootElement()?.style.removeProperty("cursor");
    document.body.style.removeProperty("cursor");
    if (userSelect.current.value) {
      document.body.style.setProperty(
        "-webkit-user-select",
        userSelect.current.value,
        userSelect.current.priority
      );
    } else {
      document.body.style.removeProperty("-webkit-user-select");
    }
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    if (!editor.isEditable()) {
      return;
    }

    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;

    if (!(image && controlWrapper)) {
      return;
    }

    const { height, width } = image.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
      return;
    }

    event.preventDefault();

    maxWidthContainerRef.current = resolveMaxWidthContainer();

    const zoom = calculateZoomLevel(image);
    const positioning = positioningRef.current;

    positioning.startWidth = width;
    positioning.startHeight = height;
    positioning.ratio = width / height;
    positioning.currentWidth = width;
    positioning.currentHeight = height;
    positioning.startX = event.clientX / zoom;
    positioning.startY = event.clientY / zoom;
    positioning.isResizing = true;
    positioning.direction = direction;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!positioning.isResizing) {
        return;
      }

      const activeZoom = calculateZoomLevel(image);
      const nextSize = computeNextSize(
        positioning,
        moveEvent.clientX,
        moveEvent.clientY,
        activeZoom,
        maxWidthContainerRef.current
      );

      image.style.width = `${nextSize.width}px`;
      image.style.height = `${nextSize.height}px`;
      positioning.currentHeight = nextSize.height;
      positioning.currentWidth = nextSize.width;
    };

    const abortController = new AbortController();

    const detachListeners = () => {
      abortController.abort();
      setEndCursor();
      // Remove imperative inline dimensions so React/Lexical attributes own
      // sizing after resize (including Undo/Redo transitions).
      image.style.removeProperty("width");
      image.style.removeProperty("height");
      controlWrapper.classList.remove("image-control-wrapper--resizing");
      cleanupActiveResizeRef.current = null;
    };

    const resetPositioning = () => {
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;
    };

    const handlePointerFinish = () => {
      const finalWidth = positioning.currentWidth;
      const finalHeight = positioning.currentHeight;
      const wasResizing = positioning.isResizing;
      resetPositioning();
      detachListeners();

      if (wasResizing && finalWidth > 0 && finalHeight > 0) {
        onResizeEnd(finalWidth, finalHeight);
      }
    };

    const handlePointerCancel = () => {
      resetPositioning();
      detachListeners();
    };

    cleanupActiveResizeRef.current = handlePointerCancel;

    setStartCursor(direction);
    onResizeStart();

    controlWrapper.classList.add("image-control-wrapper--resizing");
    image.style.height = `${height}px`;
    image.style.width = `${width}px`;

    const listenerOptions = { signal: abortController.signal };
    document.addEventListener(
      "pointermove",
      handlePointerMove,
      listenerOptions
    );
    document.addEventListener(
      "pointerup",
      handlePointerFinish,
      listenerOptions
    );
    document.addEventListener(
      "pointercancel",
      handlePointerCancel,
      listenerOptions
    );
  };

  return (
    <div
      className="absolute [&.image-control-wrapper--resizing]:touch-none"
      ref={controlWrapperRef}
    >
      {CORNER_DIRECTIONS.map((direction) => (
        <div
          aria-label={DIRECTION_LABELS[direction]}
          className={`editor-resize-handle shadow-sm ${CORNER_CLASSES[direction]}`}
          key={direction}
          onPointerDown={(event) => handlePointerDown(event, direction)}
        />
      ))}
      {edgeHandles
        ? EDGE_DIRECTIONS.map((direction) => (
            <div
              aria-label={DIRECTION_LABELS[direction]}
              className={`absolute rounded-full border border-background/20 bg-foreground shadow-sm ${EDGE_CLASSES[direction]} ${EDGE_BAR_CLASSES[direction]}`}
              key={direction}
              onPointerDown={(event) => handlePointerDown(event, direction)}
            />
          ))
        : null}
      {decorations}
    </div>
  );
}
