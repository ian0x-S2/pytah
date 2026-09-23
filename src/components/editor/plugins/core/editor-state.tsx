"use client";

import type { Transformer } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { DEFAULT_EDITOR_SNAPSHOT_OPTIONS } from "../../core/composition";
import type { ResolvedEditorSnapshotOptions } from "../../core/composition";
import { EDITOR_SEED_UPDATE_TAG } from "../../core/constants";
import type { EditorSnapshot } from "../../core/types";
import {
  loadMarkdownContent,
  readEditorSnapshot,
  readEditorTextContent,
  replaceEditorHtmlContent,
} from "../../core/utils";
import type { SnapshotUpdateSignal } from "./snapshot-update";
import { shouldEmitSnapshotUpdate } from "./snapshot-update";

export interface EditorStatePluginProps {
  initialHtml?: string;
  initialMarkdown?: string;
  onChange?: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  /**
   * When true the seed was already applied synchronously through the
   * composer's `initialConfig.editorState` — no post-mount seeding is done,
   * only the optional initial snapshot emission is replayed here.
   */
  seededViaConfig?: boolean;
  /**
   * Resolved snapshot serialization options (see `features.snapshot` on
   * `Editor`). Disabled outputs are skipped entirely; defaults to all-on.
   */
  snapshotOptions?: ResolvedEditorSnapshotOptions;
  transformers?: readonly Transformer[];
}

export function EditorStatePlugin({
  initialHtml,
  initialMarkdown,
  onChange,
  onSnapshotReady,
  seededViaConfig = false,
  snapshotOptions = DEFAULT_EDITOR_SNAPSHOT_OPTIONS,
  transformers,
}: EditorStatePluginProps) {
  const [editor] = useLexicalComposerContext();

  // `initial*` props are initial-only by contract: the seed is captured once
  // per mount and never re-applied when prop identities change. Consumers
  // remount via `key` instead — re-seeding in place would replace live state
  // and reset the caret.
  const [seed] = useState(() => ({
    html: initialHtml,
    markdown: initialMarkdown,
  }));

  const seedEditor = useEffectEvent(() => {
    if (seed.markdown) {
      loadMarkdownContent(editor, seed.markdown, {
        select: false,
        tag: EDITOR_SEED_UPDATE_TAG,
        transformers,
      });
      return;
    }

    if (seed.html) {
      replaceEditorHtmlContent(editor, seed.html, {
        select: false,
        tag: EDITOR_SEED_UPDATE_TAG,
      });
    }
  });

  const emitInitialSnapshot = useEffectEvent(() => {
    if (snapshotOptions.text) {
      onChange?.(readEditorTextContent(editor), editor);
    }

    if (snapshotOptions.html || snapshotOptions.markdown) {
      onSnapshotReady?.(
        readEditorSnapshot(editor, transformers, snapshotOptions),
        editor
      );
    }
  });

  // When the seed was applied through the composer's initial state there is
  // no seed update to observe, so the initial snapshot (when enabled) is
  // emitted directly from the already-populated state. The emission is
  // deferred one microtask because the composer's initial update commits
  // asynchronously (scheduleMicroTask) — this keeps the read deterministic
  // whether effects flush before or after that commit. The post-mount
  // seeding path remains for standalone plugin usage.
  const didEmitInitialRef = useRef(false);

  const emitConfiguredSeedSnapshot = useEffectEvent(() => {
    if (!snapshotOptions.emitInitialSnapshot) {
      return;
    }
    if (!(seed.markdown || seed.html)) {
      return;
    }
    if (didEmitInitialRef.current) {
      return;
    }
    didEmitInitialRef.current = true;
    queueMicrotask(() => {
      emitInitialSnapshot();
    });
  });

  const runMountSeed = useEffectEvent(() => {
    if (seededViaConfig) {
      emitConfiguredSeedSnapshot();
      return;
    }
    seedEditor();
  });

  useEffect(() => {
    runMountSeed();
  }, []);

  const handleUpdate = useEffectEvent((update: SnapshotUpdateSignal) => {
    if (!shouldEmitSnapshotUpdate(update, snapshotOptions)) {
      return;
    }

    if (snapshotOptions.text) {
      onChange?.(readEditorTextContent(editor), editor);
    }

    if (snapshotOptions.html || snapshotOptions.markdown) {
      onSnapshotReady?.(
        readEditorSnapshot(editor, transformers, snapshotOptions),
        editor
      );
    }
  });

  useEffect(() => editor.registerUpdateListener(handleUpdate), [editor]);

  return null;
}
