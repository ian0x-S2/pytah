import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { useRef } from "react";

type ResizeDirection = "ne" | "nw" | "se" | "sw";

interface ImageResizerProps {
  editor: LexicalEditor;
  imageRef: { current: HTMLImageElement | null };
  maxWidth?: number;
  onResizeEnd: (width: number, height: number) => void;
  onResizeStart: () => void;
}

interface ResizeState {
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

const CORNER_DIRECTIONS: ResizeDirection[] = ["ne", "se", "sw", "nw"];

const CORNER_CLASSES: Record<ResizeDirection, string> = {
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize border-t-2 border-r-2",
  se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize border-b-2 border-r-2",
  sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize border-b-2 border-l-2",
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize border-t-2 border-l-2",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isEast = (d: ResizeDirection) => d === "ne" || d === "se";

const getCursor = (d: ResizeDirection) =>
  d === "nw" || d === "se" ? "nwse-resize" : "nesw-resize";

export function ImageResizer({
  editor,
  imageRef,
  maxWidth,
  onResizeEnd,
  onResizeStart,
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
    // All corners resize both axes while locking aspect ratio.
    let diff = Math.floor(positioning.startX - event.clientX / zoom);
    diff = isEast(positioning.direction) ? -diff : diff;

    const width = clamp(positioning.startWidth + diff, 100, maxWidthContainer);
    const height = width / positioning.ratio;

    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    positioning.currentHeight = height;
    positioning.currentWidth = width;
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
      className="absolute inset-0 [&.image-control-wrapper--resizing]:touch-none"
      ref={controlWrapperRef}
    >
      {CORNER_DIRECTIONS.map((direction) => (
        <div
          className={`absolute size-2.5 rounded-full bg-primary/70 ${CORNER_CLASSES[direction]}`}
          key={direction}
          onPointerDown={(event) => handlePointerDown(event, direction)}
        />
      ))}
    </div>
  );
}
