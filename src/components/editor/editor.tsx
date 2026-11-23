"use client";

import { $generateNodesFromDOM } from "@lexical/html";
import { $convertFromMarkdownString } from "@lexical/markdown";
import type { Transformer } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";

import "./editor.css";
import { $createParagraphNode, $getRoot } from "lexical";
import type { LexicalEditor, SerializedEditorState } from "lexical";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

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
  WeblinkFaviconContext,
  WeblinkMetadataContext,
} from "./core/nodes/weblink/metadata";
import type {
  EditorActionBarControls,
  EditorChromeSlots,
  EditorOutputContext,
  EditorProps,
  EditorSnapshot,
  ExtraEditorFeature,
} from "./core/types";
import { readEditorSnapshot } from "./core/utils";
import { EXPORT_MARKDOWN_COMMAND } from "./plugins/export-markdown/commands";
import { EditorHeader, EditorShell } from "./ui/chrome";
import { EditorContent } from "./ui/content";
import { EditorActionBar, EditorOutputGrid } from "./ui/panels";

const EMPTY_EXTRA_FEATURES: readonly ExtraEditorFeature[] = [];

const DISABLED_SNAPSHOT_OPTIONS = {
  emitInitialSnapshot: false,
  html: false,
  json: false,
  markdown: false,
  text: false,
} as const;

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

function EditorActionBarSlot({
  chrome,
  controls,
  minimal,
  slots,
}: {
  chrome: ResolvedEditorChromeOptions;
  controls: EditorActionBarControls;
  minimal: boolean;
  slots?: EditorChromeSlots;
}): ReactNode {
  if (minimal || !chrome.actionBar) {
    return null;
  }

  return slots?.actionBar === undefined ? (
    <EditorActionBar {...controls} />
  ) : (
    (renderEditorSlot(slots.actionBar, controls) ?? null)
  );
}

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

function EditorOutputsSlot({
  chrome,
  context,
  minimal,
  slots,
}: {
  chrome: ResolvedEditorChromeOptions;
  context: EditorOutputContext;
  minimal: boolean;
  slots?: EditorChromeSlots;
}): ReactNode {
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
}

interface SeedEditorInput {
  html?: string;
  json?: string | SerializedEditorState | Record<string, unknown>;
  markdown?: string;
}

const createSeedEditorState =
  (
    seedInput: SeedEditorInput,
    transformers: readonly Transformer[],
    onError?: (error: Error, editor: LexicalEditor) => void
  ) =>
  (editor: LexicalEditor) => {
    if (seedInput.json) {
      try {
        const jsonString =
          typeof seedInput.json === "string"
            ? seedInput.json
            : JSON.stringify(seedInput.json);
        editor.setEditorState(editor.parseEditorState(jsonString));
        return;
      } catch (error) {
        const normalizedError =
          error instanceof Error
            ? error
            : new Error("Failed to parse initialJson editor state.");
        onError?.(normalizedError, editor);
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
        return;
      }
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
  onError,
  placeholder = DEFAULT_PLACEHOLDER,
  pluginSlots,
  slots,
  toolbar = false,
  weblinkFaviconResolver,
  weblinkMetadataFetcher,
}: EditorProps) {
  const [textContent, setTextContent] = useState("");
  const [serializedSnapshot, setSerializedSnapshot] = useState<EditorSnapshot>({
    html: "",
    json: "",
    markdown: "",
    text: "",
  });
  const editorRef = useRef<LexicalEditor | null>(null);

  const resolvedChrome = useMemo(() => resolveEditorChrome(chrome), [chrome]);
  const resolvedFeatures = useMemo(
    () => resolveEditorFeatures(features),
    [features]
  );
  const resolvedWeblinkFetcher = useMemo(
    () => resolveWeblinkFetcher(weblinkMetadataFetcher),
    [weblinkMetadataFetcher]
  );
  const stableExtraFeatures = extraFeatures ?? EMPTY_EXTRA_FEATURES;

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

  const featureNodes = useMemo(
    () => computeFeatureNodes(stableExtraFeatures),
    [stableExtraFeatures]
  );
  const transformers = useMemo(
    () => computeEditorTransformers(stableExtraFeatures),
    [stableExtraFeatures]
  );
  const commands = useMemo(
    () => computeResolvedSlashCommands(stableExtraFeatures),
    [stableExtraFeatures]
  );

  const seedEditorState = seededViaConfig
    ? createSeedEditorState(seedInput, transformers, onError)
    : undefined;

  const initialConfig = createEditorConfig({
    editable,
    editorState: seedEditorState,
    extraNodes,
    featureNodes,
    namespace,
    onError,
  });

  // Skip per-keystroke serialization and shell re-renders when nothing reads
  // the live snapshot (e.g. `<Editor minimal />` without `onChange`).
  const hasSnapshotConsumers =
    Boolean(onChange) ||
    (!minimal && (resolvedChrome.footer || resolvedChrome.outputs));

  const effectiveFeatures = useMemo(() => {
    if (hasSnapshotConsumers) {
      return resolvedFeatures;
    }

    return {
      ...resolvedFeatures,
      snapshot: DISABLED_SNAPSHOT_OPTIONS,
    };
  }, [hasSnapshotConsumers, resolvedFeatures]);

  const snapshot: EditorSnapshot = {
    ...serializedSnapshot,
    text: textContent,
  };

  const handleSnapshotChange = (nextText: string, editor: LexicalEditor) => {
    setTextContent((currentText) =>
      currentText === nextText ? currentText : nextText
    );
    editorRef.current = editor;
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
    editorRef.current = editor;
    onChange?.(nextSnapshot, editor);
  };

  const snapshotOptions = effectiveFeatures.snapshot;

  const readSerializedOutput = (
    output: "html" | "json" | "markdown"
  ): string => {
    const editor = editorRef.current;
    if (!editor) {
      return "";
    }

    const selectiveOutputs = {
      html: output === "html",
      json: output === "json",
      markdown: output === "markdown",
      text: false,
    };

    return readEditorSnapshot(editor, transformers, selectiveOutputs)[output];
  };

  const handleCopyMarkdown = async () => {
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
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.dispatchCommand(EXPORT_MARKDOWN_COMMAND, undefined);
  };

  const runAction = (action: (editor: LexicalEditor) => void) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    // Lexical's update listener in `EditorStatePlugin` emits the post-commit
    // snapshot once the update flushes, avoiding stale reads and duplicate
    // `onChange` invocations.
    action(editor);
  };

  const actionBarControls: EditorActionBarControls = {
    onExportMarkdown: resolvedFeatures.exportMarkdown
      ? handleExportMarkdown
      : undefined,
    onLoadHtml: () => runAction(loadEditorHtmlExample),
    onLoadMarkdown: () =>
      runAction((editor) => loadEditorMarkdownExample(editor, transformers)),
    onReset: () => runAction(resetEditorContent),
  };

  const defaultContent = (
    <EditorContent
      codeBlockTheme={codeBlockTheme}
      commands={commands}
      contentClassName={contentClassName}
      density={density}
      editable={editable}
      editorRef={editorRef}
      extraFeatures={stableExtraFeatures}
      features={effectiveFeatures}
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
  const actionBarContent = (
    <EditorActionBarSlot
      chrome={resolvedChrome}
      controls={actionBarControls}
      minimal={minimal}
      slots={slots}
    />
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

  const outputContent = (
    <EditorOutputsSlot
      chrome={resolvedChrome}
      context={{
        onCopyHtml: handleCopyHtml,
        onCopyJson: handleCopyJson,
        onCopyMarkdown: handleCopyMarkdown,
        snapshot,
      }}
      minimal={minimal}
      slots={slots}
    />
  );

  return (
    <div
      className={cn(!minimal && "space-y-6", className)}
      data-density={density}
    >
      <WeblinkFaviconContext.Provider value={weblinkFaviconResolver}>
        <WeblinkMetadataContext.Provider value={resolvedWeblinkFetcher}>
          <LexicalComposer initialConfig={initialConfig}>
            {editorBody}
          </LexicalComposer>
        </WeblinkMetadataContext.Provider>
      </WeblinkFaviconContext.Provider>

      {outputContent}
    </div>
  );
}
