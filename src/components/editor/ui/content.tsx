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
import { type ComponentType, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  type ResolvedEditorFeatureFlags,
  renderEditorSlot,
} from "../core/composition";
import { EditorTransformersContext } from "../core/editor-transformers-context";
import { EDITOR_FEATURES, renderSlashCommandPlugin } from "../core/features";
import type {
  EditorChromeSlots,
  EditorPluginSlots,
  EditorSnapshot,
  EditorToolbar,
  ExtraEditorFeature,
} from "../core/types";
import { BlockTypeToolbarPlugin } from "../plugins/block-type-toolbar/plugin";
import { CodeHighlightPlugin } from "../plugins/code-highlight/plugin";
import { EditablePlugin } from "../plugins/core/editable";
import { EditorStatePlugin } from "../plugins/core/editor-state";
import { HorizontalRulePlugin } from "../plugins/core/horizontal-rule";
import { FullToolbarPlugin } from "../plugins/full-toolbar/plugin";
import { LinkBehaviorPlugin } from "../plugins/link-behavior/plugin";
import {
  registerSlashRunner,
  unregisterSlashRunner,
} from "../plugins/slash-command/executors";
import type { FeatureSlashCommand } from "../plugins/slash-command/types";
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
  commands: readonly FeatureSlashCommand[];
  contentClassName?: string;
  editable: boolean;
  extraFeatures: readonly ExtraEditorFeature[];
  features: ResolvedEditorFeatureFlags;
  footerSlot?: EditorChromeSlots["footer"];
  initialHtml?: string;
  initialMarkdown?: string;
  minimal?: boolean;
  onSnapshotChange: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder: string;
  pluginSlots?: EditorPluginSlots;
  /** True when the seed was already applied via the composer's initial state. */
  seededViaConfig?: boolean;
  showFooter: boolean;
  snapshot: EditorSnapshot;
  toolbar: EditorToolbar;
  topToolbar?: EditorChromeSlots["topToolbar"];
  transformers: readonly Transformer[];
}

interface DefaultEditorPluginsProps {
  editable: boolean;
  extraFeatures: readonly ExtraEditorFeature[];
  features: ResolvedEditorFeatureFlags;
  initialHtml?: string;
  initialMarkdown?: string;
  onSnapshotChange: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  /** True when the seed was already applied via the composer's initial state. */
  seededViaConfig?: boolean;
  transformers: readonly Transformer[];
}

function DefaultEditorPlugins({
  editable,
  extraFeatures,
  features,
  initialHtml,
  initialMarkdown,
  onSnapshotChange,
  onSnapshotReady,
  seededViaConfig,
  transformers,
}: DefaultEditorPluginsProps) {
  const featurePlugins = EDITOR_FEATURES.filter((feature) => {
    return feature.plugin && !feature.editableOnly && features[feature.flag];
  });

  return (
    <EditorTransformersContext.Provider value={transformers}>
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
      {/* Extras without `editableOnly` mount for every mode, so read-only
            surfaces keep rendering installed nodes. */}
      {extraFeatures
        .filter((extra) => !extra.editableOnly && extra.plugin)
        .map((extra) => {
          const Plugin = extra.plugin as ComponentType;
          return <Plugin key={extra.id} />;
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
        seededViaConfig={seededViaConfig}
        snapshotOptions={features.snapshot}
        transformers={transformers}
      />
    </EditorTransformersContext.Provider>
  );
}

interface EditableEditorPluginsProps {
  commands: readonly FeatureSlashCommand[];
  extraFeatures: readonly ExtraEditorFeature[];
  features: ResolvedEditorFeatureFlags;
  pluginSlots?: EditorPluginSlots;
}

function EditableEditorPlugins({
  commands,
  extraFeatures,
  features,
  pluginSlots,
}: EditableEditorPluginsProps) {
  const editablePlugins = EDITOR_FEATURES.filter((feature) => {
    return feature.editableOnly && features[feature.flag];
  });
  const slashCommandEnabled = features.slashCommand;

  return (
    <>
      {pluginSlots?.beforeEditable}
      {editablePlugins.map((feature) => {
        if (feature.plugin) {
          const Plugin = feature.plugin;
          return <Plugin key={feature.flag} />;
        }
        return null;
      })}
      {/* Editable-only extras (e.g. drag handles). */}
      {extraFeatures
        .filter((extra) => extra.editableOnly && extra.plugin)
        .map((extra) => {
          const Plugin = extra.plugin as ComponentType;
          return <Plugin key={extra.id} />;
        })}
      {slashCommandEnabled ? renderSlashCommandPlugin(commands) : null}
      {pluginSlots?.afterEditable}
    </>
  );
}

export function EditorContent({
  commands,
  contentClassName,
  editable,
  extraFeatures,
  features,
  footerSlot,
  initialHtml,
  initialMarkdown,
  minimal = false,
  onSnapshotChange,
  onSnapshotReady,
  placeholder,
  pluginSlots,
  seededViaConfig,
  showFooter,
  snapshot,
  topToolbar,
  toolbar,
  transformers,
}: EditorContentProps) {
  // Expose installed feature actions to core surfaces (toolbar dropdowns)
  // without any static import from feature folders.
  useEffect(() => {
    const registered: string[] = [];

    for (const extra of extraFeatures) {
      for (const contribution of extra.slashCommands ?? []) {
        registerSlashRunner(contribution.command.id, contribution.run);
        registered.push(contribution.command.id);
      }
    }

    return () => {
      for (const id of registered) {
        unregisterSlashRunner(id);
      }
    };
  }, [extraFeatures]);

  const footerContent =
    footerSlot === undefined ? (
      <EditorFooter snapshot={snapshot} />
    ) : (
      renderEditorSlot(footerSlot, { snapshot })
    );

  return (
    <>
      <EditorTopToolbar
        commandIds={commands.map((entry) => entry.command.id)}
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
              // WebKitGTK lazily boots its enchant spell-checking broker on the
              // first spellcheck-enabled editable region; with no enchant
              // backend installed it dlopen-probes every provider serially on
              // the web-process main thread (~2s freeze, zero JS long tasks,
              // first mount per session).
              spellCheck={false}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>

      {!minimal && showFooter ? footerContent : null}

      {pluginSlots?.beforeDefault}
      <DefaultEditorPlugins
        editable={editable}
        extraFeatures={extraFeatures}
        features={features}
        initialHtml={initialHtml}
        initialMarkdown={initialMarkdown}
        onSnapshotChange={onSnapshotChange}
        onSnapshotReady={onSnapshotReady}
        seededViaConfig={seededViaConfig}
        transformers={transformers}
      />
      {editable ? (
        <EditableEditorPlugins
          commands={commands}
          extraFeatures={extraFeatures}
          features={features}
          pluginSlots={pluginSlots}
        />
      ) : null}
      {pluginSlots?.afterDefault}
    </>
  );
}
