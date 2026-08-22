"use client";

import type { Transformer } from "@lexical/markdown";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import type { LexicalEditor } from "lexical";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  type ResolvedEditorFeatureFlags,
  renderEditorSlot,
} from "../core/composition";
import {
  EDITOR_FEATURES,
  renderSeedContentPlugin,
  renderSlashCommandPlugin,
} from "../core/features";
import type {
  EditorChromeSlots,
  EditorPluginSlots,
  EditorSnapshot,
  EditorToolbar,
} from "../core/types";
import { BlockTypeToolbarPlugin } from "../plugins/block-type-toolbar/plugin";
import { CodeHighlightPlugin } from "../plugins/code-highlight/plugin";
import { EditablePlugin } from "../plugins/core/editable";
import { EditorStatePlugin } from "../plugins/core/editor-state";
import { HorizontalRulePlugin } from "../plugins/core/horizontal-rule";
import { FullToolbarPlugin } from "../plugins/full-toolbar/plugin";
import { LinkBehaviorPlugin } from "../plugins/link-behavior/plugin";
import { EditorFooter } from "./chrome";

interface EditorTopToolbarProps {
  commandIds: readonly string[];
  editable: boolean;
  toolbar: EditorToolbar;
  topToolbar?: EditorChromeSlots["topToolbar"];
}

function EditorTopToolbar({
  commandIds,
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
          <FullToolbarPlugin commandIds={commandIds} />
        ) : (
          <BlockTypeToolbarPlugin commandIds={commandIds} />
        )}
      </div>
    </div>
  );
}

interface EditorContentProps {
  commandIds: readonly string[];
  contentClassName?: string;
  editable: boolean;
  extraFeaturePlugins: readonly { id: string; plugin: ComponentType }[];
  features: ResolvedEditorFeatureFlags;
  footerSlot?: EditorChromeSlots["footer"];
  initialHtml?: string;
  initialMarkdown?: string;
  minimal?: boolean;
  onSnapshotChange: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder: string;
  pluginSlots?: EditorPluginSlots;
  showFooter: boolean;
  snapshot: EditorSnapshot;
  toolbar: EditorToolbar;
  topToolbar?: EditorChromeSlots["topToolbar"];
  transformers: readonly Transformer[];
}

interface DefaultEditorPluginsProps {
  editable: boolean;
  extraFeaturePlugins: readonly { id: string; plugin: ComponentType }[];
  features: ResolvedEditorFeatureFlags;
  initialHtml?: string;
  initialMarkdown?: string;
  onSnapshotChange: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  transformers: readonly Transformer[];
}

function DefaultEditorPlugins({
  editable,
  extraFeaturePlugins,
  features,
  initialHtml,
  initialMarkdown,
  onSnapshotChange,
  onSnapshotReady,
  transformers,
}: DefaultEditorPluginsProps) {
  const featurePlugins = EDITOR_FEATURES.filter((feature) => {
    return feature.plugin && !feature.editableOnly && features[feature.flag];
  });

  return (
    <>
      {features.history ? <HistoryPlugin /> : null}
      <CodeHighlightPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkBehaviorPlugin editable={editable} />
      {featurePlugins.map((feature) => {
        const Plugin = feature.plugin;
        if (Plugin === undefined) {
          return null;
        }
        return <Plugin key={feature.flag} />;
      })}
      <HorizontalRulePlugin />
      {features.tabIndentation ? <TabIndentationPlugin /> : null}
      {features.markdownShortcuts ? (
        <MarkdownShortcutPlugin transformers={[...transformers]} />
      ) : null}
      <EditablePlugin editable={editable} />
      <EditorStatePlugin
        initialHtml={initialHtml}
        initialMarkdown={initialMarkdown}
        onChange={onSnapshotChange}
        onSnapshotReady={onSnapshotReady}
        transformers={transformers}
      />
      {features.seedContent ? renderSeedContentPlugin(transformers) : null}
      {extraFeaturePlugins.map(({ id, plugin: Plugin }) => {
        return <Plugin key={id} />;
      })}
    </>
  );
}

interface EditableEditorPluginsProps {
  commandIds: readonly string[];
  features: ResolvedEditorFeatureFlags;
  pluginSlots?: EditorPluginSlots;
}

function EditableEditorPlugins({
  commandIds,
  features,
  pluginSlots,
}: EditableEditorPluginsProps) {
  const editablePlugins = EDITOR_FEATURES.filter((feature) => {
    return feature.editableOnly && features[feature.flag];
  });

  return (
    <>
      {pluginSlots?.beforeEditable}
      {editablePlugins.map((feature) => {
        if (feature.plugin) {
          const Plugin = feature.plugin;
          return <Plugin key={feature.flag} />;
        }
        if (feature.flag === "slashCommand") {
          return renderSlashCommandPlugin(commandIds);
        }
        return null;
      })}
      {pluginSlots?.afterEditable}
    </>
  );
}

export function EditorContent({
  commandIds,
  contentClassName,
  editable,
  extraFeaturePlugins,
  features,
  footerSlot,
  initialHtml,
  initialMarkdown,
  minimal = false,
  onSnapshotChange,
  onSnapshotReady,
  placeholder,
  pluginSlots,
  showFooter,
  snapshot,
  topToolbar,
  toolbar,
  transformers,
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
        commandIds={commandIds}
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
      <DefaultEditorPlugins
        editable={editable}
        extraFeaturePlugins={extraFeaturePlugins}
        features={features}
        initialHtml={initialHtml}
        initialMarkdown={initialMarkdown}
        onSnapshotChange={onSnapshotChange}
        onSnapshotReady={onSnapshotReady}
        transformers={transformers}
      />
      {editable ? (
        <EditableEditorPlugins
          commandIds={commandIds}
          features={features}
          pluginSlots={pluginSlots}
        />
      ) : null}
      {pluginSlots?.afterDefault}
    </>
  );
}
