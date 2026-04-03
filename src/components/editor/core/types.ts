import type { LexicalEditor } from "lexical";

export interface EditorSnapshot {
  html: string;
  markdown: string;
  text: string;
}

export interface EditorProps {
  className?: string;
  contentClassName?: string;
  editable?: boolean;
  initialHtml?: string;
  initialMarkdown?: string;
  minimal?: boolean;
  onChange?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder?: string;
}
