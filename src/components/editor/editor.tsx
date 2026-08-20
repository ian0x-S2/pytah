"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  copyEditorOutput,
  loadEditorHtmlExample,
  loadEditorMarkdownExample,
  resetEditorContent,
} from "./core/actions";
import {
  type ResolvedEditorChromeOptions,
  renderEditorSlot,
  resolveEditorChrome,
  resolveEditorFeatures,
  shouldRenderEditorShell,
} from "./core/composition";
import { createEditorConfig } from "./core/config";
import { DEFAULT_PLACEHOLDER } from "./core/constants";
import {
  computeEditorTransformers,
  computeFeatureNodes,
  type LexicalNodeList,
  resolveExtraFeaturePlugins,
  resolveSlashCommandIdsWithExtras,
} from "./core/features";
import type {
  EditorActionBarControls,
  EditorChromeSlots,
  EditorOutputContext,
  EditorProps,
  EditorSnapshot,
} from "./core/types";
import { readEditorSnapshot } from "./core/utils";
import { EditorHeader, EditorShell } from "./ui/chrome";
import { EditorContent } from "./ui/content";
import { EditorActionBar, EditorOutputGrid } from "./ui/panels";

const getEditorHeader = (
  minimal: boolean,
  chrome: ResolvedEditorChromeOptions,
  slots?: EditorChromeSlots
): ReactNode => {
  if (minimal || !chrome.header) {
    return null;
  }

  return slots?.header === undefined ? <EditorHeader /> : slots.header;
};

const getEditorActionBar = (
  minimal: boolean,
  chrome: ResolvedEditorChromeOptions,
  controls: EditorActionBarControls,
  slots?: EditorChromeSlots
): ReactNode => {
  if (minimal || !chrome.actionBar) {
    return null;
  }

  return slots?.actionBar === undefined ? (
    <EditorActionBar {...controls} />
  ) : (
    (renderEditorSlot(slots.actionBar, controls) ?? null)
  );
};

const getEditorShell = (
  minimal: boolean,
  chrome: ResolvedEditorChromeOptions,
  content: ReactNode,
  slots?: EditorChromeSlots
): ReactNode => {
  if (
    !shouldRenderEditorShell({
      chromeShell: chrome.shell,
      minimal,
      shellSlot: slots?.shell,
    })
  ) {
    return content;
  }

  return slots?.shell === undefined ? (
    <EditorShell>{content}</EditorShell>
  ) : (
    (renderEditorSlot(slots.shell, { children: content }) ?? null)
  );
};

const getEditorOutputs = (
  minimal: boolean,
  chrome: ResolvedEditorChromeOptions,
  context: EditorOutputContext,
  slots?: EditorChromeSlots
): ReactNode => {
  if (minimal || !chrome.outputs) {
    return null;
  }

  return slots?.outputs === undefined ? (
    <EditorOutputGrid
      onCopyHtml={context.onCopyHtml}
      onCopyMarkdown={context.onCopyMarkdown}
      snapshot={context.snapshot}
    />
  ) : (
    (renderEditorSlot(slots.outputs, context) ?? null)
  );
};

export function Editor({
  className,
  chrome,
  contentClassName,
  editable = true,
  extraFeatures,
  extraNodes,
  features,
  initialHtml,
  initialMarkdown,
  minimal = false,
  namespace,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  pluginSlots,
  slots,
  toolbar = false,
}: EditorProps) {
  const [textContent, setTextContent] = useState("");
  const [serializedSnapshot, setSerializedSnapshot] = useState<EditorSnapshot>({
    html: "",
    markdown: "",
    text: "",
  });
  const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(
    null
  );

  const resolvedChrome = resolveEditorChrome(chrome);
  const resolvedFeatures = resolveEditorFeatures(features);

  const featureNodes: LexicalNodeList = computeFeatureNodes(
    resolvedFeatures,
    extraFeatures
  );
  const transformers = computeEditorTransformers(
    resolvedFeatures,
    extraFeatures
  );
  const commandIds = resolveSlashCommandIdsWithExtras(
    resolvedFeatures,
    extraFeatures
  );
  const extraFeaturePlugins = resolveExtraFeaturePlugins(extraFeatures);

  const initialConfig = createEditorConfig({
    editable,
    namespace,
    featureNodes,
    extraNodes,
  });

  const snapshot: EditorSnapshot = {
    ...serializedSnapshot,
    text: textContent,
  };

  const handleSnapshotChange = (nextText: string, editor: LexicalEditor) => {
    setTextContent(nextText);
    setEditorInstance((currentEditor) => currentEditor ?? editor);
  };

  const handleSnapshotReady = (
    nextSnapshot: EditorSnapshot,
    editor: LexicalEditor
  ) => {
    setSerializedSnapshot((currentSnapshot) => {
      if (
        currentSnapshot.html === nextSnapshot.html &&
        currentSnapshot.markdown === nextSnapshot.markdown &&
        currentSnapshot.text === nextSnapshot.text
      ) {
        return currentSnapshot;
      }

      return nextSnapshot;
    });
    setEditorInstance((currentEditor) => currentEditor ?? editor);
    onChange?.(nextSnapshot, editor);
  };

  const handleCopyMarkdown = async () => {
    await copyEditorOutput(serializedSnapshot.markdown);
  };

  const handleCopyHtml = async () => {
    await copyEditorOutput(serializedSnapshot.html);
  };

  const handleReset = () => {
    if (!editorInstance) {
      return;
    }

    resetEditorContent(editorInstance);
    const nextSnapshot = readEditorSnapshot(editorInstance, transformers);
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  };

  const handleLoadHtmlExample = () => {
    if (!editorInstance) {
      return;
    }

    loadEditorHtmlExample(editorInstance);
    const nextSnapshot = readEditorSnapshot(editorInstance, transformers);
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  };

  const handleLoadMarkdownExample = () => {
    if (!editorInstance) {
      return;
    }

    loadEditorMarkdownExample(editorInstance);
    const nextSnapshot = readEditorSnapshot(editorInstance, transformers);
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  };

  const actionBarControls: EditorActionBarControls = {
    onLoadHtml: handleLoadHtmlExample,
    onLoadMarkdown: handleLoadMarkdownExample,
    onReset: handleReset,
  };

  const defaultContent = (
    <EditorContent
      commandIds={commandIds}
      contentClassName={contentClassName}
      editable={editable}
      extraFeaturePlugins={extraFeaturePlugins}
      features={resolvedFeatures}
      footerSlot={slots?.footer}
      initialHtml={initialHtml}
      initialMarkdown={initialMarkdown}
      minimal={minimal}
      onSnapshotChange={handleSnapshotChange}
      onSnapshotReady={handleSnapshotReady}
      placeholder={placeholder}
      pluginSlots={pluginSlots}
      showFooter={!minimal && resolvedChrome.footer}
      snapshot={snapshot}
      toolbar={toolbar}
      topToolbar={slots?.topToolbar}
      transformers={transformers}
    />
  );

  const headerContent = getEditorHeader(minimal, resolvedChrome, slots);
  const actionBarContent = getEditorActionBar(
    minimal,
    resolvedChrome,
    actionBarControls,
    slots
  );

  const shellChildren = (
    <>
      {headerContent}
      {actionBarContent}
      {defaultContent}
    </>
  );

  const editorBody = getEditorShell(
    minimal,
    resolvedChrome,
    minimal ? defaultContent : shellChildren,
    slots
  );

  const outputContent = getEditorOutputs(
    minimal,
    resolvedChrome,
    {
      onCopyHtml: handleCopyHtml,
      onCopyMarkdown: handleCopyMarkdown,
      snapshot,
    },
    slots
  );

  return (
    <div className={cn(!minimal && "space-y-6", className)}>
      <LexicalComposer initialConfig={initialConfig}>
        {editorBody}
      </LexicalComposer>

      {outputContent}
    </div>
  );
}
