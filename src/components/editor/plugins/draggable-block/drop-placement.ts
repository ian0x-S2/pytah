"use client";

import type { LexicalEditor, LexicalNode } from "lexical";
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $isElementNode,
  $setSelection,
} from "lexical";

import { decideInsertAfter } from "./drop-target";

/**
 * Moves the caret onto the dropped block inside the same update that moves
 * it. Element blocks get a collapsed caret at their start; decorator blocks
 * (images, embeds, dividers) get a node selection, matching click-to-select.
 * Keeping selection glued to the moved node is what stops the reconciler
 * from scrolling a stale, off-screen caret into view after the drop.
 */
function selectDroppedNode(node: LexicalNode): void {
  if ($isElementNode(node)) {
    node.selectStart();
    return;
  }

  const selection = $createNodeSelection();
  selection.add(node.getKey());
  $setSelection(selection);
}

/**
 * Moves the dragged top-level block before/after the drop target (resolved
 * in viewport space) and parks the selection on it.
 *
 * DROP_COMMAND listeners run inside Lexical's own outer update
 * (`triggerCommandListeners` wraps every priority level in
 * `updateEditorSync`), so this `editor.update` is a *nested* update: the DOM
 * move only commits when the outer update flushes, after this listener
 * returns. Reading layout or scrolling synchronously here would therefore
 * observe the pre-move DOM. Pass `onMoved` to run focus/scroll work after
 * the commit, when `editor.getElementByKey` resolves to the moved element
 * with fresh layout. Returns `true` when the payload referenced live nodes
 * and the drop was claimed.
 */
export function moveDraggedBlock(
  editor: LexicalEditor,
  draggedKey: string,
  targetElem: HTMLElement,
  clientY: number,
  onMoved?: (element: HTMLElement) => void
): boolean {
  let claimed = false;

  editor.update(
    () => {
      const draggedNode = $getNodeByKey(draggedKey);
      const targetNode = $getNearestNodeFromDOMNode(targetElem);

      if (draggedNode === null || targetNode === null) {
        return;
      }

      claimed = true;

      if (targetNode.getKey() !== draggedNode.getKey()) {
        const targetTop = targetElem.getBoundingClientRect().top;

        if (decideInsertAfter(clientY, targetTop)) {
          targetNode.insertAfter(draggedNode);
        } else {
          targetNode.insertBefore(draggedNode);
        }
      }

      selectDroppedNode(draggedNode);
    },
    {
      discrete: true,
      onUpdate: () => {
        if (!claimed || onMoved === undefined) {
          return;
        }

        const movedElement = editor.getElementByKey(draggedKey);

        if (movedElement !== null) {
          onMoved(movedElement);
        }
      },
    }
  );

  return claimed;
}

/**
 * Hands DOM focus back to the editor without scrolling, then reveals the
 * dropped block only when it is actually outside the viewport. The drop
 * point is visible by definition, so an unconditional `scrollIntoView` would
 * yank the viewport away from where the user just dropped the block; the
 * nearest-edge scroll is purely a fallback for edge-clamped drops whose
 * target resolved off-screen. This runs on every browser (the upstream
 * experimental plugin only restores focus on Firefox), so the caret
 * genuinely lands where the block did.
 */
export function focusDroppedBlock(
  editor: LexicalEditor,
  element: HTMLElement
): void {
  editor.getRootElement()?.focus({ preventScroll: true });

  const { bottom, top } = element.getBoundingClientRect();
  const viewportHeight =
    element.ownerDocument.defaultView?.innerHeight ?? window.innerHeight;

  if (top < 0 || bottom > viewportHeight) {
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}
