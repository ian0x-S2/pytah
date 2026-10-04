import type { LexicalEditor } from "lexical";
import { $setSelection } from "lexical";
import { useEffect, useRef } from "react";

import { isNativeSelectionWithinEditor } from "./floating-link-editor-position";
import type { FloatingLinkEditorSurface } from "./floating-link-editor-reducer";

/**
 * Closing the edit card is focus-destructive: while it is open, its inputs
 * own the native selection, and unmounting them (X button, Escape, outside
 * press, Apply) kills it — but the Lexical selection keeps pointing at the
 * link (`linkNode.select()` ran on open). Any later selection-reconciling
 * update then force-restores that stale selection: `@lexical/list`'s
 * checklist handler preventDefault()s pointerdown (so the native selection
 * cannot move), focuses the `<li>` and re-syncs the DOM selection with the
 * editor's selection, which yanks the caret back into the link text. On an
 * edit→closed transition: if the native selection survived inside the
 * editor (Escape from a focused root, a mousedown that moved the caret
 * first), leave the Lexical selection alone; if it died with the card,
 * clear the Lexical selection so nothing resummons it.
 */
export const useEditCardCloseSelectionReconcile = (
  editor: LexicalEditor,
  surface: FloatingLinkEditorSurface
): void => {
  const prevSurfaceRef = useRef<FloatingLinkEditorSurface>("closed");

  useEffect(() => {
    const wasEditSurface = prevSurfaceRef.current === "edit";
    prevSurfaceRef.current = surface;
    if (!(wasEditSurface && surface === "closed")) {
      return;
    }

    editor.update(() => {
      if (
        isNativeSelectionWithinEditor(
          editor.getRootElement(),
          window.getSelection()
        )
      ) {
        return;
      }

      // The native selection died with the card. Drop the Lexical selection
      // (Lexical core applies `null` selections by clearing DOM ranges) so
      // the next reconciling update cannot restore the vanished caret.
      $setSelection(null);
    });
  }, [editor, surface]);
};
