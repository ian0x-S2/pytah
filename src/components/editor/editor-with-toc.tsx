"use client";

import type { ReactNode } from "react";
import type { EditorProps } from "./core/types";
import { Editor } from "./editor";
import { EditorTableOfContents } from "./plugins/toc/sidebar";

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
  return (
    <Editor
      {...props}
      slots={{
        ...slots,
        shell: ({ children }) => (
          <>
            <div className="min-w-0">{children}</div>
            <div className="pointer-events-none fixed top-20 right-8 hidden xl:block">
              <div className="pointer-events-auto">
                {toc ?? <EditorTableOfContents className={tocClassName} />}
              </div>
            </div>
          </>
        ),
      }}
    />
  );
}
