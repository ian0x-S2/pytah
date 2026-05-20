import type { TableOfContentsEntry } from "@lexical/react/LexicalTableOfContentsPlugin";
import { $isHeadingNode } from "@lexical/rich-text";
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import {
  DEFAULT_HEADING_STYLE,
  DEFAULT_SCROLL_TOP_OFFSET,
  HEADING_STYLES,
} from "./constants";
import type { TocState } from "./types";

export const getHeadingStyle = (tag: string) => {
  return HEADING_STYLES[tag] ?? DEFAULT_HEADING_STYLE;
};

export const getScrollParent = (
  element: HTMLElement | null
): HTMLElement | Window => {
  let parent = element;
  while (parent) {
    if (parent === document.body || parent === document.documentElement) {
      break;
    }
    const style = window.getComputedStyle(parent);
    if (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
};

export const getScrollTopOffset = () => {
  const headers = Array.from(document.querySelectorAll("header"));
  let maxHeaderBottom = 0;

  for (const header of headers) {
    if (!(header instanceof HTMLElement)) {
      continue;
    }

    const { position } = window.getComputedStyle(header);
    if (position !== "fixed" && position !== "sticky") {
      continue;
    }

    maxHeaderBottom = Math.max(
      maxHeaderBottom,
      header.getBoundingClientRect().bottom
    );
  }

  return Math.max(DEFAULT_SCROLL_TOP_OFFSET, Math.round(maxHeaderBottom + 16));
};

export const scrollToHeading = (
  headingElement: HTMLElement,
  offset?: number
) => {
  const scrollParent = getScrollParent(headingElement);
  const resolvedOffset = offset ?? getScrollTopOffset();

  if (scrollParent === window) {
    const top =
      window.scrollY +
      headingElement.getBoundingClientRect().top -
      resolvedOffset;
    window.scrollTo({
      behavior: "smooth",
      top: Math.max(0, top),
    });
  } else {
    const parentEl = scrollParent as HTMLElement;
    const parentRect = parentEl.getBoundingClientRect();
    const headingRect = headingElement.getBoundingClientRect();
    const top =
      parentEl.scrollTop + (headingRect.top - parentRect.top) - resolvedOffset;
    parentEl.scrollTo({
      behavior: "smooth",
      top: Math.max(0, top),
    });
  }
};

export const scrollAndFocusHeading = (
  editor: LexicalEditor,
  headingKey: NodeKey
) => {
  const headingElement = editor.getElementByKey(headingKey);
  if (!(headingElement instanceof HTMLElement)) {
    return;
  }

  editor.update(
    () => {
      $getNodeByKey(headingKey)?.selectStart();
    },
    { discrete: true }
  );

  editor.focus();

  window.requestAnimationFrame(() => {
    scrollToHeading(headingElement);
  });
};

const isNearBottom = (scrollParent: HTMLElement | Window): boolean => {
  const isWindow = scrollParent === window;
  const scrollTop = isWindow
    ? window.scrollY
    : (scrollParent as HTMLElement).scrollTop;
  const scrollHeight = isWindow
    ? document.documentElement.scrollHeight
    : (scrollParent as HTMLElement).scrollHeight;
  const clientHeight = isWindow
    ? window.innerHeight
    : (scrollParent as HTMLElement).clientHeight;

  return scrollHeight - (scrollTop + clientHeight) < 40;
};

const getTargetLine = (
  scrollParent: HTMLElement | Window,
  offset: number
): number => {
  if (scrollParent === window) {
    return offset;
  }
  const parentRect = (scrollParent as HTMLElement).getBoundingClientRect();
  return parentRect.top + offset;
};

export const resolveActiveHeadingKey = (
  entries: readonly TableOfContentsEntry[],
  editor: LexicalEditor,
  options?: {
    currentActiveKey?: NodeKey | null;
    scrollDirection?: "up" | "down";
    scrollParent?: HTMLElement | Window;
    offset?: number;
  }
): NodeKey | null => {
  if (entries.length === 0) {
    return null;
  }

  const scrollParent = options?.scrollParent ?? window;
  if (isNearBottom(scrollParent)) {
    return entries.at(-1)?.[0] ?? null;
  }

  const offset = options?.offset ?? getScrollTopOffset();
  const currentActiveKey = options?.currentActiveKey ?? null;
  const scrollDirection = options?.scrollDirection ?? "down";
  const targetLine = getTargetLine(scrollParent, offset);

  let activeKey: NodeKey | null = null;
  const hysteresisBuffer = 15; // px buffer to prevent flickering

  for (const [key] of entries) {
    const element = editor.getElementByKey(key);
    if (!(element instanceof HTMLElement && element.isConnected)) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const top = rect.top;

    // Apply hysteresis: if this heading is currently active, we allow it to remain active slightly longer when scrolling up.
    const isCurrentlyActive = currentActiveKey === key;
    const threshold =
      isCurrentlyActive && scrollDirection === "up"
        ? targetLine + hysteresisBuffer
        : targetLine;

    if (top <= threshold) {
      activeKey = key;
      continue;
    }

    return activeKey ?? key;
  }

  return activeKey ?? entries.at(-1)?.[0] ?? null;
};

export const resolveSelectedHeadingKey = (): NodeKey | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const topLevelElement = selection.anchor
    .getNode()
    .getTopLevelElementOrThrow();
  if (!$isHeadingNode(topLevelElement)) {
    return null;
  }

  return topLevelElement.getKey();
};

export const areTocStatesEqual = (left: TocState, right: TocState) => {
  return (
    left.activeKey === right.activeKey &&
    left.selectedHeadingKey === right.selectedHeadingKey
  );
};
