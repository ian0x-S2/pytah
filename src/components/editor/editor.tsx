"use client";

import { $generateNodesFromDOM } from "@lexical/html";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import "./editor.css";
import { $createParagraphNode, $getRoot, type LexicalEditor } from "lexical";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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
  computeResolvedSlashCommands,
} from "./core/features";
import type {
  EditorActionBarControls,
  EditorChromeSlots,
  EditorOutputContext,
  EditorProps,
  EditorSnapshot,
} from "./core/types";
import { readEditorSnapshot } from "./core/utils";
import { EXPORT_MARKDOWN_COMMAND } from "./plugins/export-markdown/commands";
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

  const resolvedChrome = useMemo(() => resolveEditorChrome(chrome), [chrome]);
  const resolvedFeatures = useMemo(
    () => resolveEditorFeatures(features),
    [features]
  );

  // Seed props are initial-only by contract (consumers remount via `key`),
  // so they are captured once per mount.
  const [seedInput] = useState(() => ({
    html: initialHtml,
    markdown: initialMarkdown,
  }));
  const seededViaConfig = Boolean(seedInput.markdown || seedInput.html);

  // Derived registries are memoized so their identities stay stable across
  // re-renders (the editor state flows into React state on every keystroke);
  // otherwise every consumer of these props reconciles on each update.
  const featureNodes = useMemo(
    () => computeFeatureNodes(extraFeatures),
    [extraFeatures]
  );
  const transformers = useMemo(
    () => computeEditorTransformers(extraFeatures),
    [extraFeatures]
  );
  const commands = useMemo(
    () => computeResolvedSlashCommands(extraFeatures),
    [extraFeatures]
  );

  // Content is seeded inside LexicalComposer's *first* editor state (Lexical
  // runs this function in the initial update, before any plugin mounts), so
  // the very first paint of the editor already contains the document. A
  // post-mount effect paints an empty editor first and then re-populates the
  // whole document — a visible "content appears late" delay.
  const seedEditorState = seededViaConfig
    ? (editor: LexicalEditor) => {
        const root = $getRoot();
        root.clear();
        if (seedInput.markdown) {
          $convertFromMarkdownString(seedInput.markdown, [...transformers]);
          return;
        }
        const dom = new DOMParser().parseFromString(
          seedInput.html ?? "",
          "text/html"
        );
        root.append(...$generateNodesFromDOM(editor, dom));
        if (root.getChildrenSize() === 0) {
          root.append($createParagraphNode());
        }
      }
    : undefined;

  const initialConfig = createEditorConfig({
    editable,
    namespace,
    featureNodes,
    extraNodes,
    editorState: seedEditorState,
  });

  const snapshot: EditorSnapshot = {
    ...serializedSnapshot,
    text: textContent,
  };

  const handleSnapshotChange = (nextText: string, editor: LexicalEditor) => {
    setTextContent(nextText);
    setEditorInstance((currentEditor) => currentEditor ?? editor);
    (window as unknown as { __editor?: LexicalEditor }).__editor = editor;
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

  // Snapshot serialization options are resolved with the feature flags; the
  // editor-level handlers (copy, reset, example loaders) must respect the
  // same gating so disabled outputs are never assumed to be real content.
  const snapshotOptions = resolvedFeatures.snapshot;

  const readSerializedOutput = (output: "html" | "markdown"): string => {
    if (!editorInstance) {
      return "";
    }

    return readEditorSnapshot(
      editorInstance,
      transformers,
      output === "html"
        ? { html: true, markdown: false, text: false }
        : { html: false, markdown: true, text: false }
    )[output];
  };

  const handleCopyMarkdown = async () => {
    // When an output is disabled its stored snapshot is a "" placeholder —
    // serialize on demand so the outputs panel still copies real content.
    await copyEditorOutput(
      snapshotOptions.markdown
        ? serializedSnapshot.markdown
        : readSerializedOutput("markdown")
    );
  };

  const handleCopyHtml = async () => {
    await copyEditorOutput(
      snapshotOptions.html
        ? serializedSnapshot.html
        : readSerializedOutput("html")
    );
  };

  const handleExportMarkdown = () => {
    if (!editorInstance) {
      return;
    }

    editorInstance.dispatchCommand(EXPORT_MARKDOWN_COMMAND, undefined);
  };

  const handleReset = () => {
    if (!editorInstance) {
      return;
    }

    resetEditorContent(editorInstance);
    const nextSnapshot = readEditorSnapshot(
      editorInstance,
      transformers,
      snapshotOptions
    );
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  };

  const handleLoadHtmlExample = () => {
    if (!editorInstance) {
      return;
    }

    loadEditorHtmlExample(editorInstance);
    const nextSnapshot = readEditorSnapshot(
      editorInstance,
      transformers,
      snapshotOptions
    );
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  };

  const handleLoadMarkdownExample = () => {
    if (!editorInstance) {
      return;
    }

    loadEditorMarkdownExample(editorInstance);
    const nextSnapshot = readEditorSnapshot(
      editorInstance,
      transformers,
      snapshotOptions
    );
    setTextContent(nextSnapshot.text);
    setSerializedSnapshot(nextSnapshot);
    onChange?.(nextSnapshot, editorInstance);
  };

  const actionBarControls: EditorActionBarControls = {
    onExportMarkdown: resolvedFeatures.exportMarkdown
      ? handleExportMarkdown
      : undefined,
    onLoadHtml: handleLoadHtmlExample,
    onLoadMarkdown: handleLoadMarkdownExample,
    onReset: handleReset,
  };

  const defaultContent = (
    <EditorContent
      commands={commands}
      contentClassName={contentClassName}
      editable={editable}
      extraFeatures={extraFeatures ?? []}
      features={resolvedFeatures}
      footerSlot={slots?.footer}
      initialHtml={initialHtml}
      initialMarkdown={initialMarkdown}
      minimal={minimal}
      onSnapshotChange={handleSnapshotChange}
      onSnapshotReady={handleSnapshotReady}
      placeholder={placeholder}
      pluginSlots={pluginSlots}
      seededViaConfig={seededViaConfig}
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
