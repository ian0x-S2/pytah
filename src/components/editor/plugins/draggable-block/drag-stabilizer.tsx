"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { eventFiles } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from "lexical";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { focusDroppedBlock, moveDraggedBlock } from "./drop-placement";
import {
  hideTargetLine,
  isOnBlockDragHandleTarget,
  positionTargetLine,
  readBlockDragKey,
  resolveDropTarget,
} from "./drop-target";

interface BlockDragStabilizerProps {
  anchorElem: HTMLElement;
  menuRef: RefObject<HTMLElement | null>;
  targetLineRef: RefObject<HTMLElement | null>;
}

/**
 * Companion to the experimental upstream drag-handle plugin, which keeps
 * owning the handle/line rendering and hover tracking. The stabilizer takes
 * over the drop path at higher command priorities to fix three defects the
 * upstream version has in a window-scrolled editor:
 *
 * - before/after math mixes `pageY` (document space) with viewport rects,
 *   so scrolled drops always land "after" — every comparison here uses
 *   `clientX`/`clientY`.
 * - post-drop focus/selection restore only runs on Firefox — here the
 *   selection moves onto the dropped block on every browser.
 * - pressing the handle blurs the editor, so the caret goes stale; the drop
 *   handler below moves the selection onto the dropped block in the same
 *   update that moves it, which keeps the reconciler from scrolling a stale,
 *   off-screen caret into view.
 *
 * Drags that did not start from the handle (text selections, files) return
 * `false` untouched so their default handlers keep working.
 *
 * Note: the handle mousedown must NOT be preventDefault-ed — Chromium treats
 * a canceled mousedown as "don't start a native drag" and `dragstart` never
 * fires.
 */
export function BlockDragStabilizer({
  anchorElem,
  menuRef,
  targetLineRef,
}: BlockDragStabilizerProps) {
  const [editor] = useLexicalComposerContext();
  const ownDragRef = useRef(false);

  useEffect(() => {
    const onDragStartCapture = (event: DragEvent) => {
      const menu = menuRef.current;
      const { target } = event;
      ownDragRef.current = isOnBlockDragHandleTarget(target, menu);
    };
    const onDragEndCapture = () => {
      ownDragRef.current = false;
      hideTargetLine(targetLineRef.current);
    };

    window.addEventListener("dragstart", onDragStartCapture, true);
    window.addEventListener("dragend", onDragEndCapture, true);
    window.addEventListener("drop", onDragEndCapture, true);

    return () => {
      window.removeEventListener("dragstart", onDragStartCapture, true);
      window.removeEventListener("dragend", onDragEndCapture, true);
      window.removeEventListener("drop", onDragEndCapture, true);
    };
  }, [menuRef, targetLineRef]);

  useEffect(
    () =>
      mergeRegister(
        editor.registerCommand(
          DRAGOVER_COMMAND,
          (event: DragEvent) => {
            if (!ownDragRef.current) {
              return false;
            }

            const [isFileTransfer] = eventFiles(event);

            if (isFileTransfer) {
              return false;
            }

            if (!(event.target instanceof HTMLElement)) {
              return false;
            }

            const target = resolveDropTarget(
              editor,
              anchorElem,
              event.clientX,
              event.clientY,
              true
            );
            const line = targetLineRef.current;

            if (target === null || line === null) {
              return false;
            }

            positionTargetLine(line, target, event.clientY, anchorElem);
            event.preventDefault();
            return true;
          },
          COMMAND_PRIORITY_NORMAL
        ),
        editor.registerCommand(
          DROP_COMMAND,
          (event: DragEvent) => {
            const [isFileTransfer] = eventFiles(event);

            if (isFileTransfer) {
              return false;
            }

            const draggedKey = readBlockDragKey(event.dataTransfer);

            if (draggedKey === null) {
              return false;
            }

            if (!(event.target instanceof HTMLElement)) {
              return false;
            }

            const target = resolveDropTarget(
              editor,
              anchorElem,
              event.clientX,
              event.clientY,
              true
            );

            if (target === null) {
              return false;
            }

            const movedElement = moveDraggedBlock(
              editor,
              draggedKey,
              target,
              event.clientY
            );
            hideTargetLine(targetLineRef.current);
            ownDragRef.current = false;

            if (movedElement === null) {
              return false;
            }

            // Claim the drop: without this the browser performs its native
            // drop action afterwards (drop-caret placement, navigation for
            // exotic payloads), yanking the caret/scroll away from the
            // dropped block we just selected.
            event.preventDefault();
            focusDroppedBlock(editor, movedElement);
            return true;
          },
          COMMAND_PRIORITY_CRITICAL
        )
      ),
    [anchorElem, editor, targetLineRef]
  );

  return null;
}
