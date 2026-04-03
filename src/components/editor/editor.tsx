import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  copyEditorOutput,
  loadEditorHtmlExample,
  loadEditorMarkdownExample,
  resetEditorContent,
} from "./core/actions";
import { createEditorConfig } from "./core/config";
import { DEFAULT_PLACEHOLDER } from "./core/constants";
import type { EditorProps, EditorSnapshot } from "./core/types";
import { readEditorSnapshot } from "./core/utils";
import { EditorHeader, EditorShell } from "./ui/chrome";
import { EditorContent } from "./ui/content";
import { EditorActionBar, EditorOutputGrid } from "./ui/panels";

let hotReloadComposerKey = 0;

if (import.meta.hot) {
  hotReloadComposerKey = import.meta.hot.data.hotReloadComposerKey ?? 0;

  import.meta.hot.dispose((data) => {
    data.hotReloadComposerKey = hotReloadComposerKey + 1;
  });
}

export function Editor({
  className,
  contentClassName,
  editable = true,
  initialHtml,
  initialMarkdown,
  minimal = false,
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
    <div className={cn(!minimal && "space-y-6", className)}>
      <LexicalComposer
        initialConfig={initialConfig}
        key={`pytah-editor-${hotReloadComposerKey}`}
      >
        {minimal ? (
          <EditorContent
            contentClassName={contentClassName}
            editable={editable}
            editorInstance={editorInstance}
            initialHtml={initialHtml}
            initialMarkdown={initialMarkdown}
            minimal
            onSnapshotChange={handleSnapshotChange}
            placeholder={placeholder}
            snapshot={snapshot}
          />
        ) : (
          <EditorShell>
            <EditorHeader />
            <EditorActionBar
              onLoadHtml={handleLoadHtmlExample}
              onLoadMarkdown={handleLoadMarkdownExample}
              onReset={handleReset}
            />
            <EditorContent
              contentClassName={contentClassName}
              editable={editable}
              editorInstance={editorInstance}
              initialHtml={initialHtml}
              initialMarkdown={initialMarkdown}
              onSnapshotChange={handleSnapshotChange}
              placeholder={placeholder}
              snapshot={snapshot}
            />
          </EditorShell>
        )}
      </LexicalComposer>

      {!minimal && (
        <EditorOutputGrid
          onCopyHtml={handleCopyHtml}
          onCopyMarkdown={handleCopyMarkdown}
          snapshot={snapshot}
        />
      )}
    </div>
  );
}
