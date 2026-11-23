"use client";

import { CodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $nodesOfType } from "lexical";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useResolvedTheme } from "@/components/theme-context";
import { cn } from "@/lib/utils";

import { CodeGutterHostContext } from "./gutter-host";
import { useCodeBlockTheme } from "./theme-context";
import {
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  getCodeBlockGutterColor,
  resolveCodeBlockThemeId,
} from "./themes/registry";

interface CodeGutter {
  key: string;
  left: number;
  lineHeight: number;
  lines: number;
  paddingTop: number;
  top: number;
  width: string;
}

interface PendingCodeBlockMeasure {
  basePaddingLeft: string;
  density: string;
  element: HTMLElement;
  key: string;
  lineHeight: number;
  lines: number;
  paddingTop: number;
  rect: DOMRect;
  width: string;
}

const GUTTER_GAP = 8;
const GUTTER_LEFT_INSET = 16;

const sameGutters = (left: CodeGutter[], right: CodeGutter[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((gutter, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      gutter.key === other.key &&
      gutter.left === other.left &&
      gutter.lineHeight === other.lineHeight &&
      gutter.lines === other.lines &&
      gutter.paddingTop === other.paddingTop &&
      gutter.top === other.top &&
      gutter.width === other.width
    );
  });
};

const restoreCodePadding = (elements: ReadonlySet<HTMLElement>): void => {
  for (const element of elements) {
    element.style.paddingLeft = element.dataset.codeGutterBase ?? "";
    delete element.dataset.codeGutterBase;
    delete element.dataset.codeGutterDensity;
  }
};

/**
 * Line-number gutter overlay for editor code blocks (including code blocks
 * nested inside callouts, collapsibles, layouts, or tables). Separates DOM
 * reads from writes to avoid interleaved layout thrashing.
 */
export function CodeLineNumbersPlugin({ className }: { className?: string }) {
  const [editor] = useLexicalComposerContext();
  const host = useContext(CodeGutterHostContext);
  const themeContext = useCodeBlockTheme();
  const resolvedTheme = useResolvedTheme();
  const gutterColor = getCodeBlockGutterColor(
    resolveCodeBlockThemeId(
      themeContext?.family ?? DEFAULT_CODE_BLOCK_THEME_FAMILY,
      resolvedTheme
    )
  );
  const [gutters, setGutters] = useState<CodeGutter[]>([]);
  const touchedElements = useRef(new Set<HTMLElement>());

  useEffect(() => {
    let frameId: number | null = null;

    const collect = (): void => {
      if (!host) {
        return;
      }

      const activeDensity =
        host.closest<HTMLElement>("[data-density]")?.dataset.density ?? "";
      const codeBlocks: { element: HTMLElement; key: string; lines: number }[] =
        [];

      editor.getEditorState().read(() => {
        for (const node of $nodesOfType(CodeNode)) {
          const key = node.getKey();
          const element = editor.getElementByKey(key);
          if (!(element instanceof HTMLElement)) {
            continue;
          }
          codeBlocks.push({
            element,
            key,
            lines: node.getTextContent().split("\n").length,
          });
        }
      });

      // Prune detached or deleted code blocks so touchedElements never leaks.
      const activeElements = new Set(codeBlocks.map((item) => item.element));
      for (const element of touchedElements.current) {
        if (!activeElements.has(element)) {
          touchedElements.current.delete(element);
        }
      }

      // Reset cached base padding if density changed before measuring.
      for (const { element } of codeBlocks) {
        if (
          element.dataset.codeGutterBase !== undefined &&
          element.dataset.codeGutterDensity !== activeDensity
        ) {
          element.style.paddingLeft = "";
          delete element.dataset.codeGutterBase;
          delete element.dataset.codeGutterDensity;
        }
      }

      // Phase 1: batch all layout reads.
      const hostRect = host.getBoundingClientRect();
      const measures: PendingCodeBlockMeasure[] = [];

      for (const { element, key, lines } of codeBlocks) {
        const computed = window.getComputedStyle(element);
        const basePaddingLeft =
          element.dataset.codeGutterBase ?? computed.paddingLeft;
        const width = `${String(lines).length}ch`;
        const rect = element.getBoundingClientRect();

        measures.push({
          basePaddingLeft,
          density: activeDensity,
          element,
          key,
          lineHeight: Number.parseFloat(computed.lineHeight) || 32,
          lines,
          paddingTop: Number.parseFloat(computed.paddingTop) || 0,
          rect,
          width,
        });
      }

      // Phase 2: batch all DOM style writes.
      const next: CodeGutter[] = [];
      for (const measure of measures) {
        const {
          basePaddingLeft,
          density,
          element,
          key,
          lineHeight,
          lines,
          paddingTop,
          rect,
          width,
        } = measure;

        if (element.dataset.codeGutterBase !== basePaddingLeft) {
          element.dataset.codeGutterBase = basePaddingLeft;
        }
        element.dataset.codeGutterDensity = density;
        const nextPaddingLeft = `calc(${basePaddingLeft} + ${width} + ${GUTTER_LEFT_INSET + GUTTER_GAP}px)`;
        if (element.style.paddingLeft !== nextPaddingLeft) {
          element.style.paddingLeft = nextPaddingLeft;
        }
        touchedElements.current.add(element);

        next.push({
          key,
          left: rect.left - hostRect.left + GUTTER_LEFT_INSET,
          lineHeight,
          lines,
          paddingTop,
          top: rect.top - hostRect.top,
          width,
        });
      }

      setGutters((previous) => (sameGutters(previous, next) ? previous : next));
    };

    const scheduleCollect = (): void => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        collect();
      });
    };

    collect();
    const unregister = editor.registerUpdateListener(scheduleCollect);
    const observer = new ResizeObserver(scheduleCollect);
    if (host) {
      observer.observe(host);
    }
    const touched = touchedElements.current;
    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      unregister();
      observer.disconnect();
      restoreCodePadding(touched);
      touched.clear();
    };
  }, [editor, host]);

  if (!host) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 select-none",
        className
      )}
    >
      {gutters.map((gutter) => (
        <div
          className="absolute font-mono text-sm"
          data-code-gutter={gutter.key}
          key={gutter.key}
          style={{
            left: gutter.left,
            top: gutter.top + gutter.paddingTop,
            width: gutter.width,
          }}
        >
          {Array.from({ length: gutter.lines }, (_, index) => (
            <span
              className="block text-right text-muted-foreground/60"
              key={`${gutter.key}:${index}`}
              style={{
                height: gutter.lineHeight,
                lineHeight: `${gutter.lineHeight}px`,
                ...(gutterColor === undefined ? null : { color: gutterColor }),
              }}
            >
              {index + 1}
            </span>
          ))}
        </div>
      ))}
    </div>,
    host
  );
}
