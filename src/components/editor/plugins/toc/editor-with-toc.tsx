"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { EditorProps } from "../../core/types";
import { Editor } from "../../editor";
import { EditorTableOfContents } from "./sidebar";

/** Viewport offset used before the first measurement lands (previous default). */
const TOC_FALLBACK_TOP_PX = 96;

interface EditorWithTocProps extends EditorProps {
  /** Replace the default TOC sidebar with a custom element. */
  toc?: ReactNode;
  /** Additional className for the TOC sidebar. */
  tocClassName?: string;
}

/**
 * A composition wrapper that renders the `Editor` alongside a sticky
 * Table of Contents sidebar.
 *
 * The TOC is rendered **inside** the LexicalComposer tree (via `slots.shell`)
 * so it can read heading state from the editor. The consumer controls the
 * outer page layout — this component only provides the two-column structure.
 */
export function EditorWithToc({
  slots,
  toc,
  tocClassName,
  ...props
}: EditorWithTocProps) {
  // The TOC floats on the viewport (`fixed`), but is meant to start at the
  // same vertical level as the editor content — the space above it (page
  // title, zen padding) is consumer-owned and varies, so a static offset
  // can't keep them aligned. Measuring the content column's top and using
  // it as the fixed `top` keeps the rail aligned for any layout above.
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [tocTop, setTocTop] = useState(TOC_FALLBACK_TOP_PX);

  useLayoutEffect(() => {
    const measure = () => {
      const content = contentRef.current;
      if (!content) {
        return;
      }
      const rect = content.getBoundingClientRect();
      // Measure the document-relative top so resizing while scrolled down
      // preserves the top-of-page alignment instead of pinning to 24px.
      const documentTop = Math.round(rect.top + window.scrollY);
      const maxTop = Math.max(24, window.innerHeight - 120);
      setTocTop(Math.min(maxTop, Math.max(24, documentTop)));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [toc]);

  const tocStyle = { "--toc-top": `${tocTop}px` } as CSSProperties;

  return (
    <Editor
      {...props}
      slots={{
        ...slots,
        shell: ({ children }) => (
          <>
            <div ref={contentRef} className="min-w-0">
              {children}
            </div>
            {toc !== null && (
              <div
                className="pointer-events-none fixed top-(--toc-top) right-6 z-30 hidden xl:block"
                style={tocStyle}
              >
                <div className="pointer-events-auto">
                  {toc ?? <EditorTableOfContents className={tocClassName} />}
                </div>
              </div>
            )}
          </>
        ),
      }}
    />
  );
}
