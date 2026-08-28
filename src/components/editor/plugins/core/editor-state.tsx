"use client";

import type { Transformer } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState, LexicalEditor } from "lexical";
import { HISTORY_MERGE_TAG } from "lexical";
import { useEffect, useEffectEvent, useState } from "react";
import {
  DEFAULT_EDITOR_SNAPSHOT_OPTIONS,
  type ResolvedEditorSnapshotOptions,
} from "../../core/composition";
import { EDITOR_SEED_UPDATE_TAG } from "../../core/constants";
import type { EditorSnapshot } from "../../core/types";
import {
  loadMarkdownContent,
  readEditorSnapshot,
  readEditorTextContent,
  replaceEditorHtmlContent,
} from "../../core/utils";

export interface EditorStatePluginProps {
  initialHtml?: string;
  initialMarkdown?: string;
  onChange?: (textContent: string, editor: LexicalEditor) => void;
  onSnapshotReady?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  /**
   * Resolved snapshot serialization options (see `features.snapshot` on
   * `Editor`). Disabled outputs are skipped entirely; defaults to all-on.
   */
  snapshotOptions?: ResolvedEditorSnapshotOptions;
  transformers?: readonly Transformer[];
}

/** Structural subset of Lexical's update-listener payload used for filtering. */
export interface SnapshotUpdateSignal {
  dirtyElements: { readonly size: number };
  dirtyLeaves: { readonly size: number };
  prevEditorState: EditorState;
  tags: ReadonlySet<string>;
}

/**
 * Decides whether an editor update should produce serialized outputs.
 * Mirrors OnChangePlugin semantics (selection-only, history-merge and
 * initial-empty updates are ignored) plus suppression of the tagged mount
 * seed when `emitInitialSnapshot` is `false`.
 */
export const shouldEmitSnapshotUpdate = (
  update: SnapshotUpdateSignal,
  options: { emitInitialSnapshot: boolean }
): boolean => {
  if (update.dirtyElements.size === 0 && update.dirtyLeaves.size === 0) {
    return false;
  }
  if (update.tags.has(HISTORY_MERGE_TAG)) {
    return false;
  }
  if (update.prevEditorState.isEmpty()) {
    return false;
  }
  if (!options.emitInitialSnapshot && update.tags.has(EDITOR_SEED_UPDATE_TAG)) {
    return false;
  }
  return true;
};

export function EditorStatePlugin({
  initialHtml,
  initialMarkdown,
  onChange,
  onSnapshotReady,
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

  // Runs exactly once per mount; the seed itself is captured in the
  // initializer above, so later prop identity changes never re-seed.
  useEffect(() => {
    seedEditor();
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

  useEffect(() => {
    return editor.registerUpdateListener(handleUpdate);
  }, [editor]);

  return null;
}
