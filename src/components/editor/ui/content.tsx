"use client";

import type { Transformer } from "@lexical/markdown";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import type { LexicalEditor, SerializedEditorState } from "lexical";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, CSSProperties, RefObject } from "react";

import { useResolvedTheme } from "@/components/theme-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { renderEditorSlot } from "../core/composition";
import type { ResolvedEditorFeatureFlags } from "../core/composition";
import {
  EditorCommandsContext,
  EditorFloatingLinkEnabledContext,
  EditorResolvedCommandsContext,
} from "../core/editor-commands-context";
import { EditorTransformersContext } from "../core/editor-transformers-context";
import { EDITOR_FEATURES, renderSlashCommandPlugin } from "../core/features";
import type {
  EditorChromeSlots,
  EditorDensity,
  EditorPluginSlots,
  EditorSnapshot,
  EditorToolbar,
  ExtraEditorFeature,
} from "../core/types";
import { BlockTypeToolbarPlugin } from "../plugins/block-type-toolbar/plugin";
import { CodeBlockChromePlugin } from "../plugins/code-highlight/block-chrome";
import { CodeGutterHostContext } from "../plugins/code-highlight/gutter-host";
import { CodeLineNumbersPlugin } from "../plugins/code-highlight/line-numbers";
import { CodeHighlightPlugin } from "../plugins/code-highlight/plugin";
import { CodeSelectAllPlugin } from "../plugins/code-highlight/select-all-plugin";
import { CodeBlockThemeContext } from "../plugins/code-highlight/theme-context";
import {
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  getCodeBlockBackground,
  getCodeBlockForeground,
  resolveCodeBlockThemeId,
} from "../plugins/code-highlight/themes/registry";
import type { CodeBlockThemeFamily } from "../plugins/code-highlight/themes/registry";
import { EditablePlugin } from "../plugins/core/editable";
import { EditorStatePlugin } from "../plugins/core/editor-state";
import { HorizontalRulePlugin } from "../plugins/core/horizontal-rule";
import { FullToolbarPlugin } from "../plugins/full-toolbar/plugin";
import { LinkBehaviorPlugin } from "../plugins/link-behavior/plugin";
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
    <div className="editor-toolbar">
      <ScrollArea>
        {toolbar === "full" ? (
          <FullToolbarPlugin commandIds={commandIds} />
        ) : (
          <BlockTypeToolbarPlugin commandIds={commandIds} />
        )}
      </ScrollArea>
    </div>
  );
}

interface EditorContentProps {
  codeBlockTheme?: CodeBlockThemeFamily;
  commands: readonly FeatureSlashCommand[];
  contentClassName?: string;
  density?: EditorDensity;
  editable: boolean;
  editorRef?: RefObject<LexicalEditor | null>;
  extraFeatures: readonly ExtraEditorFeature[];
  features: ResolvedEditorFeatureFlags;
  footerSlot?: EditorChromeSlots["footer"];
  initialHtml?: string;
  initialJson?: string | SerializedEditorState | Record<string, unknown>;
  initialMarkdown?: string;
  minimal?: boolean;
  onSnapshotChange: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  /** True when the seed was already applied via the composer's initial state. */
  placeholder: string;
  pluginSlots?: EditorPluginSlots;
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
  initialJson?: string | SerializedEditorState | Record<string, unknown>;
  initialMarkdown?: string;
  onSnapshotChange: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  seededViaConfig?: boolean;
  transformers: readonly Transformer[];
}

function DefaultEditorPlugins({
  editable,
  extraFeatures,
  features,
  initialHtml,
  initialJson,
  initialMarkdown,
  onSnapshotChange,
  onSnapshotReady,
  seededViaConfig,
  transformers,
}: DefaultEditorPluginsProps) {
  const featurePlugins = EDITOR_FEATURES.filter(
    (feature) =>
      feature.plugin && !feature.editableOnly && features[feature.flag]
  );

  return (
    <>
      {features.history ? <HistoryPlugin /> : null}
      <CodeHighlightPlugin />
      <CodeSelectAllPlugin />
      <CodeLineNumbersPlugin />
      <CodeBlockChromePlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkBehaviorPlugin
        editable={editable}
        enablePasteMenu={features.linkPasteMenu}
      />
      {featurePlugins.map((feature) => {
        const Plugin = feature.plugin;
        if (Plugin === undefined) {
          return null;
        }
        return <Plugin key={feature.flag} />;
      })}
      {extraFeatures.flatMap((extra) => {
        if (extra.editableOnly || !extra.plugin) {
          return [];
        }
        const Plugin = extra.plugin as ComponentType;
        return [<Plugin key={extra.id} />];
      })}
      <HorizontalRulePlugin />
      {features.tabIndentation ? <TabIndentationPlugin /> : null}
      {features.markdownShortcuts ? (
        <MarkdownShortcutPlugin transformers={[...transformers]} />
      ) : null}
      <EditablePlugin editable={editable} />
      <EditorStatePlugin
        initialHtml={initialHtml}
        initialJson={initialJson}
        initialMarkdown={initialMarkdown}
        onChange={onSnapshotChange}
        onSnapshotReady={onSnapshotReady}
        seededViaConfig={seededViaConfig}
        snapshotOptions={features.snapshot}
        transformers={transformers}
      />
    </>
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
  const editablePlugins = EDITOR_FEATURES.filter(
    (feature) => feature.editableOnly && features[feature.flag]
  );
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
      {extraFeatures.flatMap((extra) => {
        if (!extra.editableOnly || !extra.plugin) {
          return [];
        }
        const Plugin = extra.plugin as ComponentType;
        return [<Plugin key={extra.id} />];
      })}
      {slashCommandEnabled ? renderSlashCommandPlugin(commands) : null}
      {pluginSlots?.afterEditable}
    </>
  );
}

export function EditorContent({
  codeBlockTheme,
  commands,
  contentClassName,
  density = "comfortable",
  editable,
  editorRef,
  extraFeatures,
  features,
  footerSlot,
  initialHtml,
  initialJson,
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
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editorRef) {
      return;
    }

    editorRef.current = editor;
    return () => {
      if (editorRef.current === editor) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);

  const footerContent =
    footerSlot === undefined ? (
      <EditorFooter snapshot={snapshot} />
    ) : (
      renderEditorSlot(footerSlot, { snapshot })
    );

  const [gutterHost, setGutterHost] = useState<HTMLElement | null>(null);

  const [themeFamily, setThemeFamily] = useState<CodeBlockThemeFamily>(
    codeBlockTheme ?? DEFAULT_CODE_BLOCK_THEME_FAMILY
  );
  const themeValue = useMemo(
    () => ({ family: themeFamily, setFamily: setThemeFamily }),
    [themeFamily]
  );

  const resolvedTheme = useResolvedTheme();
  const resolvedCodeThemeId = resolveCodeBlockThemeId(
    themeFamily,
    resolvedTheme
  );
  const codeBlockBackground = getCodeBlockBackground(resolvedCodeThemeId);
  const codeBlockForeground = getCodeBlockForeground(resolvedCodeThemeId);

  const commandIds = useMemo(
    () => commands.map((entry) => entry.command.id),
    [commands]
  );

  return (
    <CodeGutterHostContext.Provider value={gutterHost}>
      <CodeBlockThemeContext.Provider value={themeValue}>
        <EditorTransformersContext.Provider value={transformers}>
          <EditorFloatingLinkEnabledContext.Provider
            value={features.floatingLinkEditor}
          >
            <EditorCommandsContext.Provider value={commands}>
              <EditorResolvedCommandsContext.Provider value={commandIds}>
                <EditorTopToolbar
                  commandIds={commandIds}
                  editable={editable}
                  toolbar={toolbar}
                  topToolbar={topToolbar}
                />

                <div
                  className="group relative bg-background"
                  data-density={density}
                  style={
                    {
                      "--editor-code-bg": codeBlockBackground,
                      "--editor-code-fg": codeBlockForeground,
                    } as CSSProperties
                  }
                >
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-placeholder={placeholder}
                        className={cn(
                          "ContentEditable__root editor-content focus:outline-none",
                          contentClassName
                        )}
                        placeholder={
                          <div className="editor-content-placeholder pointer-events-none text-muted-foreground">
                            {placeholder}
                          </div>
                        }
                        spellCheck={false}
                      />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <div
                    className="pointer-events-none absolute inset-0"
                    ref={setGutterHost}
                  />
                </div>

                {!minimal && showFooter ? footerContent : null}

                {pluginSlots?.beforeDefault}
                <DefaultEditorPlugins
                  editable={editable}
                  extraFeatures={extraFeatures}
                  features={features}
                  initialHtml={initialHtml}
                  initialJson={initialJson}
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
              </EditorResolvedCommandsContext.Provider>
            </EditorCommandsContext.Provider>
          </EditorFloatingLinkEnabledContext.Provider>
        </EditorTransformersContext.Provider>
      </CodeBlockThemeContext.Provider>
    </CodeGutterHostContext.Provider>
  );
}
