import type { EditorState } from "lexical";
import { HISTORY_MERGE_TAG } from "lexical";

import { EDITOR_SEED_UPDATE_TAG } from "../../core/constants";

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
