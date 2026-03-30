import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import type { LexicalEditor } from "lexical";
import type { EditorSnapshot } from "./editor-types";
import { EditorFooter } from "./editor-ui";
import { BlockTypeToolbarPlugin } from "./plugins/block-type-toolbar/plugin";
import { EditablePlugin } from "./plugins/editable-plugin";
import { EditorStatePlugin } from "./plugins/editor-state-plugin";
import { FloatingToolbarPlugin } from "./plugins/floating-toolbar/plugin";
import { FocusOnMountPlugin } from "./plugins/focus-on-mount-plugin";
import { HorizontalRulePlugin } from "./plugins/horizontal-rule-plugin";
import { LinkBehaviorPlugin } from "./plugins/link-behavior/plugin";
import { EDITOR_MARKDOWN_TRANSFORMERS } from "./plugins/markdown/transformers";
import { SeedContentPlugin } from "./plugins/seed-content-plugin";
import { SlashCommandPlugin } from "./plugins/slash-command/plugin";
import { TableBehaviorPlugin } from "./plugins/table-behavior/plugin";

interface EditorTopToolbarProps {
  editable: boolean;
}

function EditorTopToolbar({ editable }: EditorTopToolbarProps) {
  if (!editable) {
    return null;
  }

  return (
    <div className="border-border border-b bg-background px-3 py-2">
      <div className="overflow-x-auto">
        <BlockTypeToolbarPlugin />
      </div>
    </div>
  );
}

interface EditorContentProps {
  editable: boolean;
  editorInstance: LexicalEditor | null;
  initialHtml?: string;
  initialMarkdown?: string;
  onSnapshotChange: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder: string;
  snapshot: EditorSnapshot;
}

export function EditorContent({
  editable,
  editorInstance,
  initialHtml,
  initialMarkdown,
  onSnapshotChange,
  placeholder,
  snapshot,
}: EditorContentProps) {
  return (
    <>
      <EditorTopToolbar editable={editable} />

      <div className="group relative bg-background">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-placeholder={placeholder}
              className="relative min-h-105 px-8 py-10 text-[17px] leading-8 focus:outline-none"
              placeholder={
                <div className="pointer-events-none absolute top-10 left-8 text-muted-foreground">
                  {placeholder}
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>

      <EditorFooter snapshot={snapshot} />

      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkBehaviorPlugin editable={editable} />
      <HorizontalRulePlugin />
      <TableBehaviorPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={EDITOR_MARKDOWN_TRANSFORMERS} />
      <EditablePlugin editable={editable} />
      <EditorStatePlugin
        initialHtml={initialHtml}
        initialMarkdown={initialMarkdown}
        onChange={onSnapshotChange}
      />
      <SeedContentPlugin editor={editorInstance} />
      {editable ? (
        <>
          <FocusOnMountPlugin />
          <FloatingToolbarPlugin />
          <SlashCommandPlugin />
        </>
      ) : null}
    </>
  );
}
