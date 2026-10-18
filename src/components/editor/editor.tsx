"use client";

import { $generateNodesFromDOM } from "@lexical/html";
import { $convertFromMarkdownString } from "@lexical/markdown";
import type { Transformer } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";

import "./editor.css";
import { $createParagraphNode, $getRoot } from "lexical";
import type { LexicalEditor, SerializedEditorState } from "lexical";
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
  renderEditorSlot,
  resolveEditorChrome,
  resolveEditorFeatures,
  shouldRenderEditorShell,
} from "./core/composition";
import type { ResolvedEditorChromeOptions } from "./core/composition";
import { createEditorConfig } from "./core/config";
import { DEFAULT_PLACEHOLDER } from "./core/constants";
import {
  computeEditorTransformers,
  computeFeatureNodes,
  computeResolvedSlashCommands,
} from "./core/features";
import {
  resolveWeblinkFetcher,
  WeblinkMetadataContext,
} from "./core/nodes/weblink/metadata";
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

  // Aliased to `handle*` names so JSX handler props receive functions
  // with the `handle` prefix convention.
  const {
    onCopyHtml: handleCopyHtml,
    onCopyMarkdown: handleCopyMarkdown,
    snapshot,
  } = context;

  return slots?.outputs === undefined ? (
    <EditorOutputGrid
      onCopyHtml={handleCopyHtml}
      onCopyMarkdown={handleCopyMarkdown}
      snapshot={snapshot}
    />
  ) : (
    (renderEditorSlot(slots.outputs, context) ?? null)
  );
};

interface SeedEditorInput {
  html?: string;
  json?: string | SerializedEditorState | Record<string, unknown>;
  markdown?: string;
}

const createSeedEditorState =
  (seedInput: SeedEditorInput, transformers: readonly Transformer[]) =>
  (editor: LexicalEditor) => {
    if (seedInput.json) {
      const jsonString =
        typeof seedInput.json === "string"
          ? seedInput.json
          : JSON.stringify(seedInput.json);
      editor.setEditorState(editor.parseEditorState(jsonString));
      return;
    }
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
  };

export function Editor({
  className,
  chrome,
  codeBlockTheme,
  contentClassName,
  density = "comfortable",
  editable = true,
  extraFeatures,
  extraNodes,
  features,
  initialHtml,
  initialJson,
  initialMarkdown,
  minimal = false,
  namespace,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  pluginSlots,
  slots,
  toolbar = false,
  weblinkMetadataFetcher,
}: EditorProps) {
  const [textContent, setTextContent] = useState("");
  const [serializedSnapshot, setSerializedSnapshot] = useState<EditorSnapshot>({
    html: "",
    json: "",
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
  const resolvedWeblinkFetcher = useMemo(
    () => resolveWeblinkFetcher(weblinkMetadataFetcher),
    [weblinkMetadataFetcher]
  );

  // Seed props are initial-only by contract (consumers remount via `key`),
  // so they are captured once per mount.
  const [seedInput] = useState(() => ({
    html: initialHtml,
    json: initialJson,
    markdown: initialMarkdown,
  }));
  const seededViaConfig = Boolean(
    seedInput.markdown || seedInput.html || seedInput.json
  );

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
    ? createSeedEditorState(seedInput, transformers)
    : undefined;

  const initialConfig = createEditorConfig({
    editable,
    editorState: seedEditorState,
    extraNodes,
    featureNodes,
    namespace,
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
        currentSnapshot.json === nextSnapshot.json &&
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

  const readSerializedOutput = (
    output: "html" | "json" | "markdown"
  ): string => {
    if (!editorInstance) {
      return "";
    }

    const selectiveOutputs = {
      html: output === "html",
      json: output === "json",
      markdown: output === "markdown",
      text: false,
    };

    return readEditorSnapshot(editorInstance, transformers, selectiveOutputs)[
      output
    ];
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

  const handleCopyJson = async () => {
    await copyEditorOutput(
      snapshotOptions.json
        ? serializedSnapshot.json
        : readSerializedOutput("json")
    );
  };

  const handleExportMarkdown = () => {
    if (!editorInstance) {
      return;
    }

    editorInstance.dispatchCommand(EXPORT_MARKDOWN_COMMAND, undefined);
  };

  const runAndSync = (action: (editor: LexicalEditor) => void) => {
    if (!editorInstance) {
      return;
    }

    action(editorInstance);
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
    onLoadHtml: () => runAndSync(loadEditorHtmlExample),
    onLoadMarkdown: () => runAndSync(loadEditorMarkdownExample),
    onReset: () => runAndSync(resetEditorContent),
  };

  const defaultContent = (
    <EditorContent
      codeBlockTheme={codeBlockTheme}
      commands={commands}
      contentClassName={contentClassName}
      density={density}
      editable={editable}
      extraFeatures={extraFeatures ?? []}
      features={resolvedFeatures}
      footerSlot={slots?.footer}
      initialHtml={initialHtml}
      initialJson={initialJson}
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
      onCopyJson: handleCopyJson,
      onCopyMarkdown: handleCopyMarkdown,
      snapshot,
    },
    slots
  );

  return (
    <div
      className={cn(!minimal && "space-y-6", className)}
      data-density={density}
    >
      <WeblinkMetadataContext.Provider value={resolvedWeblinkFetcher}>
        <LexicalComposer initialConfig={initialConfig}>
          {editorBody}
        </LexicalComposer>
      </WeblinkMetadataContext.Provider>

      {outputContent}
    </div>
  );
}
