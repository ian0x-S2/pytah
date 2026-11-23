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
  const [renderFailed, setRenderFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const hasExplicitDimensions = width !== "inherit" && height !== "inherit";
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const fillsBox = hasExplicitDimensions || isDraggingBox;

  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") {
      return;
    }

    const syncFillMode = () => {
      setIsDraggingBox(box.style.width !== "" && box.style.height !== "");
    };

    const observer = new ResizeObserver(syncFillMode);
    observer.observe(box);
    syncFillMode();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderScene = async () => {
      // oxlint-disable-next-line react/todo -- dynamic import() for code-splitting; oxlint HIR cannot lower it (upstream limitation, not a code issue)
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      const nextSvg = await exportToSvg({
        appState,
        elements: [...elements],
        files: files ?? null,
      });

      nextSvg.removeAttribute("width");
      nextSvg.removeAttribute("height");

      if (!cancelled) {
        setRenderFailed(false);
        setSvg(nextSvg);
      }
    };

    void (async () => {
      try {
        await renderScene();
      } catch {
        if (!cancelled) {
          setRenderFailed(true);
        }
      }
    })();

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
      svg.style.height = "100%";
      svg.setAttribute("preserveAspectRatio", "none");
      return;
    }

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
      {!svg && renderFailed ? (
        <div className="flex min-h-24 min-w-48 items-center justify-center px-4 py-3 text-xs text-muted-foreground">
          Unable to render drawing
        </div>
      ) : null}
    </div>
  );
}
