"use client";

import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { CodeGutterHostContext } from "./gutter-host";

interface CodeGutter {
  key: string;
  left: number;
  lineHeight: number;
  lines: number;
  paddingTop: number;
  top: number;
}

const GUTTER_WIDTH = 40;
const GUTTER_GAP = 8;

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
      gutter.top === other.top
    );
  });
};

const restoreCodePadding = (elements: ReadonlySet<HTMLElement>): void => {
  for (const element of elements) {
    element.style.paddingLeft = element.dataset.codeGutterBase ?? "";
    delete element.dataset.codeGutterBase;
  }
};

/**
 * Line-number gutter overlay for editor code blocks.
 *
 * Lexical renders a `CodeNode` as a single `<code>` element with no
 * per-line elements, so CSS counters cannot number lines. Instead this
 * plugin measures each code block after commit and renders a
 * pointer-events-none gutter (portal'd into the positioned wrapper host)
 * with one number per logical line. Counts track edits through the update
 * listener; the gutter stays pinned on horizontal scroll because it lives
 * outside the code element's own scroller, and page scroll moves gutter
 * and code together.
 */
export function CodeLineNumbersPlugin({ className }: { className?: string }) {
  const [editor] = useLexicalComposerContext();
  const host = useContext(CodeGutterHostContext);
  const [gutters, setGutters] = useState<CodeGutter[]>([]);
  const touchedElements = useRef(new Set<HTMLElement>());

  useEffect(() => {
    const collect = (): void => {
      if (!host) {
        return;
      }
      const hostRect = host.getBoundingClientRect();
      const next: CodeGutter[] = [];
      editor.getEditorState().read(() => {
        for (const child of $getRoot().getChildren()) {
          if (!$isCodeNode(child)) {
            continue;
          }
          const element = editor.getElementByKey(child.getKey());
          if (!(element instanceof HTMLElement)) {
            continue;
          }
          const computed = window.getComputedStyle(element);
          // Remember the theme's own padding once so re-collection never
          // stacks the gutter reservation on top of itself.
          const basePaddingLeft =
            element.dataset.codeGutterBase ??
            (() => {
              const value = computed.paddingLeft;
              element.dataset.codeGutterBase = value;
              return value;
            })();
          element.style.paddingLeft = `calc(${basePaddingLeft} + ${GUTTER_WIDTH + GUTTER_GAP}px)`;
          touchedElements.current.add(element);
          const rect = element.getBoundingClientRect();
          next.push({
            key: child.getKey(),
            left: rect.left - hostRect.left,
            lineHeight: Number.parseFloat(computed.lineHeight) || 32,
            lines: child.getTextContent().split("\n").length,
            paddingTop: Number.parseFloat(computed.paddingTop) || 0,
            top: rect.top - hostRect.top,
          });
        }
      });
      setGutters((previous) => (sameGutters(previous, next) ? previous : next));
    };

    collect();
    const unregister = editor.registerUpdateListener(() => {
      collect();
    });
    const touched = touchedElements.current;
    return () => {
      unregister();
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
            width: GUTTER_WIDTH,
          }}
        >
          {Array.from({ length: gutter.lines }, (_, index) => (
            <span
              className="block text-right text-muted-foreground/60"
              key={`${gutter.key}:${index}`}
              style={{
                height: gutter.lineHeight,
                lineHeight: `${gutter.lineHeight}px`,
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
