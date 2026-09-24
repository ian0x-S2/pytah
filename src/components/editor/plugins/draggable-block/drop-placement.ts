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
 * in viewport space) and parks the selection on it. The update is discrete
 * so the DOM move commits synchronously: the returned element is already in
 * its new position and safe to focus/scroll to. Returns the moved DOM
 * element, or `null` when the payload did not reference a live node.
 */
export function moveDraggedBlock(
  editor: LexicalEditor,
  draggedKey: string,
  targetElem: HTMLElement,
  clientY: number
): HTMLElement | null {
  editor.update(
    () => {
      const draggedNode = $getNodeByKey(draggedKey);
      const targetNode = $getNearestNodeFromDOMNode(targetElem);

      if (draggedNode === null || targetNode === null) {
        return;
      }

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
    { discrete: true }
  );

  return editor.getElementByKey(draggedKey);
}

/**
 * Hands DOM focus back to the editor without scrolling, then pins the
 * viewport at the dropped block with a minimal nearest-edge scroll. This
 * runs on every browser (the upstream experimental plugin only restores
 * focus on Firefox), so the caret genuinely lands where the block did.
 */
export function focusDroppedBlock(
  editor: LexicalEditor,
  element: HTMLElement
): void {
  editor.getRootElement()?.focus({ preventScroll: true });
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
}
