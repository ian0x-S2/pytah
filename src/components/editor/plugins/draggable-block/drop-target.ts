"use client";

import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { $getRoot } from "lexical";

/**
 * DataTransfer payload that identifies a handle-initiated block drag. This
 * mirrors the experimental upstream plugin, which owns `dragstart` and writes
 * this entry — the stabilizer only *reads* it on drop.
 */
export const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";

const TARGET_LINE_HALF_HEIGHT = 2;
const TEXT_BOX_HORIZONTAL_PADDING = 28;
const MENU_SPACE = 4;

export function isOnBlockDragHandleTarget(
  target: EventTarget | null,
  menu: HTMLElement | null
): boolean {
  return menu !== null && target instanceof Node && menu.contains(target);
}

const SEARCH_UP = -1;
const SEARCH_DOWN = 1;
const SEARCH_UNDECIDED = 0;

// Remembers the last hit so consecutive dragover resolutions start nearby
// instead of scanning from the middle of the document every time.
let prevIndex = Infinity;

function getSearchStart(keysLength: number): number {
  if (keysLength === 0) {
    return Infinity;
  }

  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }

  return Math.floor(keysLength / 2);
}

function safeMargin(value: string | undefined): number {
  // getComputedStyle normalizes margins to "<number>px" (or "").
  const parsed = Number((value ?? "").replace("px", ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function effectiveZoom(element: HTMLElement): number {
  // calculateZoomLevel can report 0/NaN where CSS zoom is unsupported
  // (e.g. synthetic DOMs); viewport math needs a sane divisor.
  return calculateZoomLevel(element) || 1;
}

function getCollapsedMargins(element: HTMLElement): {
  marginBottom: number;
  marginTop: number;
} {
  const view = element.ownerDocument.defaultView;
  const getMargin = (
    sibling: Element | null,
    margin: "marginBottom" | "marginTop"
  ): number => {
    if (sibling === null || view === null) {
      return 0;
    }

    return safeMargin(view.getComputedStyle(sibling)[margin]);
  };
  const style = view?.getComputedStyle(element);

  return {
    marginBottom: Math.max(
      safeMargin(style?.marginBottom ?? ""),
      getMargin(element.nextElementSibling, "marginTop")
    ),
    marginTop: Math.max(
      safeMargin(style?.marginTop ?? ""),
      getMargin(element.previousElementSibling, "marginBottom")
    ),
  };
}

/**
 * Reads the dragged block key from a drop event. Returns `null` for drags
 * that did not originate from the block handle (text selections, files),
 * which must keep flowing to the default handlers.
 */
export function readBlockDragKey(
  dataTransfer: DataTransfer | null | undefined
): string | null {
  if (!dataTransfer) {
    return null;
  }

  try {
    const key = dataTransfer.getData(DRAG_DATA_FORMAT);
    return key === "" ? null : key;
  } catch {
    return null;
  }
}

/**
 * Decides whether the dragged block lands after the target block. Pure on
 * viewport coordinates: `clientY` and `getBoundingClientRect().top` share
 * the same origin, unlike `pageY` which also carries the page scroll offset
 * and would force "after" whenever the page is scrolled.
 */
export function decideInsertAfter(clientY: number, targetTop: number): boolean {
  return clientY >= targetTop;
}

/**
 * Clamps out-of-document cursor positions to the first/last block, in
 * viewport space.
 */
function matchEdgeBlock(
  editor: LexicalEditor,
  topLevelKeys: string[],
  clientY: number
): HTMLElement | null {
  const lastKey = topLevelKeys.at(-1);

  if (topLevelKeys.length === 0 || lastKey === undefined) {
    return null;
  }

  const firstNode = editor.getElementByKey(topLevelKeys[0]);
  const lastNode = editor.getElementByKey(lastKey);
  const firstRect = firstNode?.getBoundingClientRect();
  const lastRect = lastNode?.getBoundingClientRect();

  if (!firstNode || !lastNode || !firstRect || !lastRect) {
    return null;
  }

  if (clientY / effectiveZoom(firstNode) < firstRect.top) {
    return firstNode;
  }

  if (clientY / effectiveZoom(lastNode) > lastRect.bottom) {
    return lastNode;
  }

  return null;
}

/**
 * Walks the top-level blocks from the last hit toward the viewport point.
 */
function walkBlocks(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  topLevelKeys: string[],
  clientX: number,
  clientY: number
): HTMLElement | null {
  const anchorRect = anchorElem.getBoundingClientRect();
  let index = getSearchStart(topLevelKeys.length);
  let direction = SEARCH_UNDECIDED;

  while (index >= 0 && index < topLevelKeys.length) {
    const elem = editor.getElementByKey(topLevelKeys[index]);

    if (elem === null) {
      return null;
    }

    const zoom = effectiveZoom(elem);
    const pointX = clientX / zoom;
    const pointY = clientY / zoom;
    const rect = elem.getBoundingClientRect();
    const { marginBottom, marginTop } = getCollapsedMargins(elem);
    const top = rect.top - marginTop;
    const bottom = rect.bottom + marginBottom;
    const inside =
      pointY >= top &&
      pointY <= bottom &&
      pointX >= anchorRect.left &&
      pointX <= anchorRect.right;

    if (inside) {
      prevIndex = index;
      return elem;
    }

    if (direction === SEARCH_UNDECIDED) {
      if (pointY < top) {
        direction = SEARCH_UP;
      } else if (pointY > bottom) {
        direction = SEARCH_DOWN;
      } else {
        // Horizontally outside the text column: no block can match.
        return null;
      }
    }

    index += direction;
  }

  return null;
}

/**
 * Resolves the top-level block element under viewport point
 * (`clientX`, `clientY`). Same search shape as the experimental upstream
 * plugin, but every comparison stays in viewport space so the hit stays
 * correct while the page is scrolled.
 */
export function resolveDropTarget(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  clientX: number,
  clientY: number,
  useEdgeAsDefault = false
): HTMLElement | null {
  const topLevelKeys = editor
    .getEditorState()
    .read(() => $getRoot().getChildrenKeys());

  return editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const edge = matchEdgeBlock(editor, topLevelKeys, clientY);

      if (edge !== null) {
        return edge;
      }
    }

    return walkBlocks(editor, anchorElem, topLevelKeys, clientX, clientY);
  });
}

/**
 * Positions the drop indicator line relative to the target block, using the
 * viewport-space cursor (`clientY`) for the before/after side.
 */
export function positionTargetLine(
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  clientY: number,
  anchorElem: HTMLElement
): void {
  const { height: targetHeight, top: targetTop } =
    targetBlockElem.getBoundingClientRect();
  const { top: anchorTop, width: anchorWidth } =
    anchorElem.getBoundingClientRect();
  const { marginBottom, marginTop } = getCollapsedMargins(targetBlockElem);

  let lineTop = targetTop;

  if (clientY >= targetTop) {
    lineTop += targetHeight + marginBottom / 2;
  } else {
    lineTop -= marginTop / 2;
  }

  const top =
    lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT + anchorElem.scrollTop;
  const left = TEXT_BOX_HORIZONTAL_PADDING - MENU_SPACE;

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`;
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - MENU_SPACE) * 2}px`;
  targetLineElem.style.opacity = ".4";
}

export function hideTargetLine(
  targetLineElem: HTMLElement | null | undefined
): void {
  if (targetLineElem) {
    targetLineElem.style.opacity = "0";
    targetLineElem.style.transform = "translate(-10000px, -10000px)";
  }
}
