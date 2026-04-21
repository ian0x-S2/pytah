"use client";

import {
  TableOfContentsPlugin as LexicalTableOfContentsPlugin,
  type TableOfContentsEntry,
} from "@lexical/react/LexicalTableOfContentsPlugin";
import type { LexicalEditor } from "lexical";
import type { ReactNode } from "react";

interface EditorTableOfContentsPluginProps {
  children: (
    entries: readonly TableOfContentsEntry[],
    editor: LexicalEditor
  ) => ReactNode;
}

export function EditorTableOfContentsPlugin({
  children,
}: EditorTableOfContentsPluginProps) {
  return (
    <LexicalTableOfContentsPlugin>
      {(entries, editor) => <>{children(entries, editor)}</>}
    </LexicalTableOfContentsPlugin>
  );
}
