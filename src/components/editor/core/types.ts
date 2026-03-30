import type { LexicalEditor } from "lexical";

export interface EditorSnapshot {
  html: string;
  markdown: string;
  text: string;
}

export interface EditorProps {
  className?: string;
  editable?: boolean;
  initialHtml?: string;
  initialMarkdown?: string;
  onChange?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder?: string;
}
