import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { useRef } from "react";

type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

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

const RESIZE_DIRECTIONS: ResizeDirection[] = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
];

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const isEast = (direction: ResizeDirection) => {
  return direction === "e" || direction === "ne" || direction === "se";
};

const isWest = (direction: ResizeDirection) => {
  return direction === "w" || direction === "nw" || direction === "sw";
};

const isNorth = (direction: ResizeDirection) => {
  return direction === "n" || direction === "ne" || direction === "nw";
};

const isSouth = (direction: ResizeDirection) => {
  return direction === "s" || direction === "se" || direction === "sw";
};

const getCursor = (direction: ResizeDirection) => {
  if (direction === "e" || direction === "w") {
    return "ew-resize";
  }

  if (direction === "n" || direction === "s") {
    return "ns-resize";
  }

  if (direction === "nw" || direction === "se") {
    return "nwse-resize";
  }

  return "nesw-resize";
};

const getHandleClassName = (direction: ResizeDirection) => {
  const cornerClassName =
    "absolute h-3 w-3 rounded-full border border-primary/70 bg-background shadow-sm";
  const sideClassName =
    "absolute top-1/2 h-12 w-2 -translate-y-1/2 rounded-full border border-primary/70 bg-background shadow-sm";

  switch (direction) {
    case "n":
      return `${cornerClassName} left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize`;
    case "ne":
      return `${cornerClassName} right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize`;
    case "e":
      return `${sideClassName} right-0 translate-x-1/2 cursor-ew-resize`;
    case "se":
      return `${cornerClassName} bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize`;
    case "s":
      return `${cornerClassName} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize`;
    case "sw":
      return `${cornerClassName} bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize`;
    case "w":
      return `${sideClassName} left-0 -translate-x-1/2 cursor-ew-resize`;
    case "nw":
      return `${cornerClassName} left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize`;
    default:
      return cornerClassName;
  }
};

export function ImageResizer({
  editor,
  imageRef,
  maxWidth,
  onResizeEnd,
  onResizeStart,
}: ImageResizerProps) {
  const controlWrapperRef = useRef<HTMLDivElement | null>(null);
  const userSelect = useRef({
    priority: "",
    value: "default",
  });
  const positioningRef = useRef<ResizeState>({
    currentHeight: 0,
    currentWidth: 0,
    direction: "e",
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
  const maxHeightContainer = editorRootElement
    ? editorRootElement.getBoundingClientRect().height - 20
    : 100;

  const setStartCursor = (direction: ResizeDirection) => {
    const cursor = getCursor(direction);

    if (editorRootElement) {
      editorRootElement.style.setProperty("cursor", cursor, "important");
    }

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
    const horizontal =
      isEast(positioning.direction) || isWest(positioning.direction);
    const vertical =
      isNorth(positioning.direction) || isSouth(positioning.direction);

    if (horizontal && vertical) {
      let diff = Math.floor(positioning.startX - event.clientX / zoom);
      diff = isEast(positioning.direction) ? -diff : diff;

      const width = clamp(
        positioning.startWidth + diff,
        100,
        maxWidthContainer
      );
      const height = width / positioning.ratio;

      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      positioning.currentHeight = height;
      positioning.currentWidth = width;
      return;
    }

    if (vertical) {
      let diff = Math.floor(positioning.startY - event.clientY / zoom);
      diff = isSouth(positioning.direction) ? -diff : diff;

      const height = clamp(
        positioning.startHeight + diff,
        100,
        maxHeightContainer
      );

      image.style.height = `${height}px`;
      positioning.currentHeight = height;
      return;
    }

    let diff = Math.floor(positioning.startX - event.clientX / zoom);
    diff = isEast(positioning.direction) ? -diff : diff;

    const width = clamp(positioning.startWidth + diff, 100, maxWidthContainer);

    image.style.width = `${width}px`;
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
      className="absolute inset-0 rounded-2xl [&.image-control-wrapper--resizing]:touch-none"
      ref={controlWrapperRef}
    >
      {RESIZE_DIRECTIONS.map((direction) => (
        <div
          className={getHandleClassName(direction)}
          key={direction}
          onPointerDown={(event) => handlePointerDown(event, direction)}
        />
      ))}
    </div>
  );
}
