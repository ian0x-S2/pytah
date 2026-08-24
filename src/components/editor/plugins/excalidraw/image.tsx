"use client";

import type {
  ExcalidrawElement,
  NonDeleted,
} from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import { useEffect, useRef, useState } from "react";

interface ExcalidrawImageProps {
  appState?: Partial<AppState>;
  containerRef?: { current: HTMLDivElement | null };
  elements: readonly NonDeleted<ExcalidrawElement>[];
  files?: BinaryFiles;
  height: number | "inherit";
  width: number | "inherit";
}

/**
 * Appends an excalidraw-produced svg element to the DOM. The element is built
 * imperatively by excalidraw's export runtime, so it is attached outside of
 * React's ownership model instead of serialized into markup. The wrapper is
 * the direct child of the sized container and must forward its height so
 * `height: 100%` on the svg reaches the container's explicit box.
 */
function SvgHost({ svg }: { svg: SVGSVGElement }) {
  return (
    <div
      className="h-full w-full"
      ref={(node) => {
        if (node?.firstElementChild !== svg) {
          node?.replaceChildren(svg);
        }
      }}
    />
  );
}

/**
 * Renders an excalidraw scene as a static svg image. The heavy `exportToSvg`
 * runtime is loaded on demand so documents without drawings never pay for it.
 */
export function ExcalidrawImage({
  appState,
  containerRef,
  elements,
  files,
  height,
  width,
}: ExcalidrawImageProps) {
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // The drawing fills its box (free resize) whenever both axes carry explicit
  // dimensions; otherwise it keeps the viewBox aspect ratio and drives its
  // own height. Initialized from the committed props so SSR-safe renders
  // match, then kept in sync with the box's live inline styles.
  const [fillsBox, setFillsBox] = useState(
    width !== "inherit" && height !== "inherit"
  );

  // A resize drag styles the box imperatively every frame, long before the
  // node commit updates `width`/`height` props. Observing the box keeps the
  // svg stretching in real time so handles never detach mid-drag.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") {
      return;
    }

    const syncFillMode = () => {
      setFillsBox(box.style.width !== "" && box.style.height !== "");
    };

    const observer = new ResizeObserver(syncFillMode);
    observer.observe(box);
    syncFillMode();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderScene = async () => {
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      const nextSvg = await exportToSvg({
        appState,
        elements: [...elements],
        files: files ?? null,
      });

      // Generated svgs carry fixed pixel dimensions; strip them so the
      // sizing effect below fully controls the fluid box.
      nextSvg.removeAttribute("width");
      nextSvg.removeAttribute("height");

      if (!cancelled) {
        setSvg(nextSvg);
      }
    };

    renderScene().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [appState, elements, files]);

  useEffect(() => {
    if (!svg) {
      return;
    }

    svg.style.display = "block";
    svg.style.width = "100%";

    if (fillsBox) {
      // Fill the resized box; corners stay glued to the drawing.
      svg.style.height = "100%";
      svg.setAttribute("preserveAspectRatio", "none");
      return;
    }

    // Keep the viewBox aspect ratio and drive the container height.
    svg.style.height = "auto";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [fillsBox, svg]);

  const style: React.CSSProperties = {};
  if (width !== "inherit") {
    style.width = `${width}px`;
  }
  if (height !== "inherit") {
    style.height = `${height}px`;
  }

  return (
    <div
      className="max-w-full"
      ref={(node) => {
        boxRef.current = node;
        if (containerRef && node) {
          containerRef.current = node;
        }
      }}
      style={style}
    >
      {svg ? <SvgHost svg={svg} /> : null}
    </div>
  );
}
