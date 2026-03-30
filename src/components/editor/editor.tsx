import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  copyEditorOutput,
  loadEditorHtmlExample,
  loadEditorMarkdownExample,
  resetEditorContent,
} from "./editor-actions";
import { createEditorConfig } from "./editor-config";
import { DEFAULT_PLACEHOLDER } from "./editor-constants";
import { EditorContent } from "./editor-content";
import { EditorActionBar, EditorOutputGrid } from "./editor-panels";
import type { EditorProps, EditorSnapshot } from "./editor-types";
import { EditorHeader, EditorShell } from "./editor-ui";
import { readEditorSnapshot } from "./editor-utils";

export function Editor({
  className,
  editable = true,
  initialHtml,
  initialMarkdown,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
}: EditorProps) {
  const [snapshot, setSnapshot] = useState<EditorSnapshot>({
    html: "",
    markdown: "",
    text: "",
  });
  const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(
    null
  );

  const initialConfig = createEditorConfig(editable);

  const handleSnapshotChange = useCallback(
    (nextSnapshot: EditorSnapshot, editor: LexicalEditor) => {
      setSnapshot(nextSnapshot);
      setEditorInstance(editor);
      onChange?.(nextSnapshot, editor);
    },
    [onChange]
  );

  const handleCopyMarkdown = useCallback(async () => {
    await copyEditorOutput(snapshot.markdown);
  }, [snapshot.markdown]);

  const handleCopyHtml = useCallback(async () => {
    await copyEditorOutput(snapshot.html);
  }, [snapshot.html]);

  const handleReset = useCallback(() => {
    if (!editorInstance) {
      return;
    }

    resetEditorContent(editorInstance);
    setSnapshot(readEditorSnapshot(editorInstance));
  }, [editorInstance]);

  const handleLoadHtmlExample = useCallback(() => {
    if (!editorInstance) {
      return;
    }

    loadEditorHtmlExample(editorInstance);
    setSnapshot(readEditorSnapshot(editorInstance));
  }, [editorInstance]);

  const handleLoadMarkdownExample = useCallback(() => {
    if (!editorInstance) {
      return;
    }

    loadEditorMarkdownExample(editorInstance);
    setSnapshot(readEditorSnapshot(editorInstance));
  }, [editorInstance]);

  return (
    <div className={cn("space-y-6", className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <EditorShell>
          <EditorHeader />
          <EditorActionBar
            onLoadHtml={handleLoadHtmlExample}
            onLoadMarkdown={handleLoadMarkdownExample}
            onReset={handleReset}
          />
          <EditorContent
            editable={editable}
            editorInstance={editorInstance}
            initialHtml={initialHtml}
            initialMarkdown={initialMarkdown}
            onSnapshotChange={handleSnapshotChange}
            placeholder={placeholder}
            snapshot={snapshot}
          />
        </EditorShell>
      </LexicalComposer>

      <EditorOutputGrid
        onCopyHtml={handleCopyHtml}
        onCopyMarkdown={handleCopyMarkdown}
        snapshot={snapshot}
      />
    </div>
  );
}
