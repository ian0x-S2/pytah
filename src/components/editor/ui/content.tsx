import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import type { LexicalEditor } from "lexical";
import { cn } from "@/lib/utils";
import {
  type ResolvedEditorFeatureFlags,
  renderEditorSlot,
} from "../core/composition";
import type {
  EditorChromeSlots,
  EditorPluginSlots,
  EditorSnapshot,
  EditorToolbar,
} from "../core/types";
import { BlockTypeToolbarPlugin } from "../plugins/block-type-toolbar/plugin";
import { CollapsiblePlugin } from "../plugins/collapsible/plugin";
import { EditablePlugin } from "../plugins/core/editable";
import { EditorStatePlugin } from "../plugins/core/editor-state";
import { FocusOnMountPlugin } from "../plugins/core/focus-on-mount";
import { HorizontalRulePlugin } from "../plugins/core/horizontal-rule";
import { SeedContentPlugin } from "../plugins/core/seed-content";
import { DraggableBlockPlugin } from "../plugins/draggable-block/plugin";
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar/plugin";
import { FullToolbarPlugin } from "../plugins/full-toolbar/plugin";
import { ImagePlugin } from "../plugins/image/plugin";
import { LayoutPlugin } from "../plugins/layout/plugin";
import { FloatingLinkEditorPlugin } from "../plugins/link-behavior/floating-link-editor";
import { LinkBehaviorPlugin } from "../plugins/link-behavior/plugin";
import { EDITOR_MARKDOWN_TRANSFORMERS } from "../plugins/markdown/transformers";
import { SlashCommandPlugin } from "../plugins/slash-command/plugin";
import { TableBehaviorPlugin } from "../plugins/table-behavior/plugin";
import { YouTubePlugin } from "../plugins/youtube/plugin";
import { EditorFooter } from "./chrome";

interface EditorTopToolbarProps {
  editable: boolean;
  toolbar: EditorToolbar;
  topToolbar?: EditorChromeSlots["topToolbar"];
}

function EditorTopToolbar({
  editable,
  topToolbar,
  toolbar,
}: EditorTopToolbarProps) {
  if (!editable) {
    return null;
  }

  if (topToolbar !== undefined) {
    return topToolbar;
  }

  if (!toolbar) {
    return null;
  }

  return (
    <div className="px-8 py-2">
      <div className="overflow-x-auto">
        {toolbar === "full" ? (
          <FullToolbarPlugin />
        ) : (
          <BlockTypeToolbarPlugin />
        )}
      </div>
    </div>
  );
}

interface EditorContentProps {
  contentClassName?: string;
  editable: boolean;
  editorInstance: LexicalEditor | null;
  features: ResolvedEditorFeatureFlags;
  footerSlot?: EditorChromeSlots["footer"];
  initialHtml?: string;
  initialMarkdown?: string;
  minimal?: boolean;
  onSnapshotChange: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder: string;
  pluginSlots?: EditorPluginSlots;
  showFooter: boolean;
  snapshot: EditorSnapshot;
  toolbar: EditorToolbar;
  topToolbar?: EditorChromeSlots["topToolbar"];
}

export function EditorContent({
  contentClassName,
  editable,
  editorInstance,
  features,
  footerSlot,
  initialHtml,
  initialMarkdown,
  minimal = false,
  onSnapshotChange,
  placeholder,
  pluginSlots,
  showFooter,
  snapshot,
  topToolbar,
  toolbar,
}: EditorContentProps) {
  const footerContent =
    footerSlot === undefined ? (
      <EditorFooter snapshot={snapshot} />
    ) : (
      renderEditorSlot(footerSlot, { snapshot })
    );

  return (
    <>
      <EditorTopToolbar
        editable={editable}
        toolbar={toolbar}
        topToolbar={topToolbar}
      />

      <div className="group relative bg-background">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-placeholder={placeholder}
              className={cn(
                "ContentEditable__root relative min-h-105 px-8 py-10 text-[17px] leading-8 focus:outline-none",
                contentClassName
              )}
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

      {!minimal && showFooter ? footerContent : null}

      {pluginSlots?.beforeDefault}
      {features.history ? <HistoryPlugin /> : null}
      <ListPlugin />
      <CheckListPlugin />
      <LinkBehaviorPlugin editable={editable} />
      <ImagePlugin />
      <YouTubePlugin />
      <CollapsiblePlugin />
      <LayoutPlugin />
      <HorizontalRulePlugin />
      <TableBehaviorPlugin />
      {features.tabIndentation ? <TabIndentationPlugin /> : null}
      {features.markdownShortcuts ? (
        <MarkdownShortcutPlugin transformers={EDITOR_MARKDOWN_TRANSFORMERS} />
      ) : null}
      <EditablePlugin editable={editable} />
      <EditorStatePlugin
        initialHtml={initialHtml}
        initialMarkdown={initialMarkdown}
        onChange={onSnapshotChange}
      />
      {features.seedContent ? (
        <SeedContentPlugin editor={editorInstance} />
      ) : null}
      {editable ? (
        <>
          {pluginSlots?.beforeEditable}
          {features.focusOnMount ? <FocusOnMountPlugin /> : null}
          {features.draggableBlocks ? <DraggableBlockPlugin /> : null}
          {features.floatingToolbar ? <FloatingToolbarPlugin /> : null}
          {features.floatingLinkEditor ? <FloatingLinkEditorPlugin /> : null}
          {features.slashCommand ? <SlashCommandPlugin /> : null}
          {pluginSlots?.afterEditable}
        </>
      ) : null}
      {pluginSlots?.afterDefault}
    </>
  );
}
