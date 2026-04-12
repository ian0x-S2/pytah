"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { LexicalEditor } from "lexical";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
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
} from "./core/composition";
import { createEditorConfig } from "./core/config";
import { DEFAULT_PLACEHOLDER } from "./core/constants";
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
  if (minimal || !chrome.shell) {
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

  const initialConfig = createEditorConfig({
    editable,
    namespace,
    nodes: extraNodes,
  });

  const snapshot = useMemo<EditorSnapshot>(() => {
    return {
      ...serializedSnapshot,
      text: textContent,
    };
  }, [serializedSnapshot, textContent]);

  const handleSnapshotChange = useCallback(
    (nextText: string, editor: LexicalEditor) => {
      setTextContent(nextText);
      setEditorInstance((currentEditor) => currentEditor ?? editor);
    },
    []
  );

  const handleSnapshotReady = useCallback(
    (nextSnapshot: EditorSnapshot, editor: LexicalEditor) => {
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
    },
    [onChange]
  );

  const handleCopyMarkdown = useCallback(async () => {
    await copyEditorOutput(serializedSnapshot.markdown);
  }, [serializedSnapshot.markdown]);

  const handleCopyHtml = useCallback(async () => {
    await copyEditorOutput(serializedSnapshot.html);
  }, [serializedSnapshot.html]);

  const handleReset = useCallback(() => {
    if (!editorInstance) {
      return;
    }

    resetEditorContent(editorInstance);
    const nextSnapshot = readEditorSnapshot(editorInstance);
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  }, [editorInstance, onChange]);

  const handleLoadHtmlExample = useCallback(() => {
    if (!editorInstance) {
      return;
    }

    loadEditorHtmlExample(editorInstance);
    const nextSnapshot = readEditorSnapshot(editorInstance);
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  }, [editorInstance, onChange]);

  const handleLoadMarkdownExample = useCallback(() => {
    if (!editorInstance) {
      return;
    }

    loadEditorMarkdownExample(editorInstance);
    const nextSnapshot = readEditorSnapshot(editorInstance);
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  }, [editorInstance, onChange]);

  const actionBarControls: EditorActionBarControls = {
    onLoadHtml: handleLoadHtmlExample,
    onLoadMarkdown: handleLoadMarkdownExample,
    onReset: handleReset,
  };

  const defaultContent = (
    <EditorContent
      contentClassName={contentClassName}
      editable={editable}
      editorInstance={editorInstance}
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
