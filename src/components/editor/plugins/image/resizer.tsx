"use client";

import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { useLayoutEffect, useRef } from "react";
import {
  type CornerDirection,
  computeNextSize,
  type EdgeDirection,
  getCursor,
  type ResizeDirection,
  type ResizeState,
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

const CORNER_DIRECTIONS: CornerDirection[] = ["ne", "se", "sw", "nw"];
const EDGE_DIRECTIONS: EdgeDirection[] = ["n", "e", "s", "w"];

const CORNER_CLASSES: Record<CornerDirection, string> = {
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
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

  const editorRootElement = editor.getRootElement();
  let maxWidthContainer = 100;
  if (maxWidth) {
    maxWidthContainer = maxWidth;
  } else if (editorRootElement) {
    maxWidthContainer = editorRootElement.getBoundingClientRect().width - 20;
  }

  // The overlay must track the element being resized, not the surrounding
  // container. The container is `max-w-full` and gets clamped to the content
  // column, but the element keeps its explicit box and can overflow it — so
  // `inset-0` (relative to the container) would detach the handles from the
  // element's true corners. Anchor instead to the element's layout geometry
  // (offset* are unaffected by ancestor transforms/zoom) and re-sync whenever
  // the element or its positioning context changes.
  //
  // `imageRef` (the stable ref object) is the dependency, not `.current`:
  // reading ref values during render is invalid. Callers bind the ref to an
  // element that persists for this component's lifetime — the overlay mounts
  // together with selection — and the ResizeObserver keeps bounds in sync
  // after that.
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
    const offsetParent = image.offsetParent;
    if (offsetParent) {
      observer.observe(offsetParent);
    }
    return () => observer.disconnect();
  }, [imageRef]);

  const setStartCursor = (direction: ResizeDirection) => {
    const cursor = getCursor(direction);
    editorRootElement?.style.setProperty("cursor", cursor, "important");
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
    editorRootElement?.style.setProperty("cursor", "text");
    document.body.style.setProperty("cursor", "default");
    document.body.style.setProperty(
      "-webkit-user-select",
      userSelect.current.value,
      userSelect.current.priority
    );
  };

  const handlePointerMove = (event: PointerEvent) => {
    const image = imageRef.current;
    const positioning = positioningRef.current;

    if (!(image && positioning.isResizing)) {
      return;
    }

    const zoom = calculateZoomLevel(image);
    const nextSize = computeNextSize(
      positioning,
      event.clientX,
      event.clientY,
      zoom,
      maxWidthContainer
    );

    image.style.width = `${nextSize.width}px`;
    image.style.height = `${nextSize.height}px`;
    positioning.currentHeight = nextSize.height;
    positioning.currentWidth = nextSize.width;
  };

  const handlePointerUp = () => {
    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;
    const positioning = positioningRef.current;

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    setEndCursor();

    if (!(image && controlWrapper && positioning.isResizing)) {
      return;
    }

    const width = positioning.currentWidth;
    const height = positioning.currentHeight;

    positioning.startWidth = 0;
    positioning.startHeight = 0;
    positioning.ratio = 0;
    positioning.startX = 0;
    positioning.startY = 0;
    positioning.currentWidth = 0;
    positioning.currentHeight = 0;
    positioning.isResizing = false;

    controlWrapper.classList.remove("image-control-wrapper--resizing");
    onResizeEnd(width, height);
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

    event.preventDefault();

    const { height, width } = image.getBoundingClientRect();
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

    setStartCursor(direction);
    onResizeStart();

    controlWrapper.classList.add("image-control-wrapper--resizing");
    image.style.height = `${height}px`;
    image.style.width = `${width}px`;

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      className="absolute [&.image-control-wrapper--resizing]:touch-none"
      ref={controlWrapperRef}
    >
      {CORNER_DIRECTIONS.map((direction) => (
        <div
          className={`absolute size-2 rounded-full border border-background/20 bg-foreground shadow-sm ${CORNER_CLASSES[direction]}`}
          key={direction}
          onPointerDown={(event) => handlePointerDown(event, direction)}
        />
      ))}
      {edgeHandles
        ? EDGE_DIRECTIONS.map((direction) => (
            <div
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
