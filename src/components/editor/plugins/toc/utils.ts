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
  ACTIVE_HEADING_TOP_OFFSET,
  DEFAULT_HEADING_STYLE,
  DEFAULT_SCROLL_TOP_OFFSET,
  HEADING_STYLES,
} from "./constants";
import type { TocState } from "./types";

export const getHeadingStyle = (tag: string) => {
  return HEADING_STYLES[tag] ?? DEFAULT_HEADING_STYLE;
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

const scrollToHeading = (headingElement: HTMLElement) => {
  const top =
    window.scrollY +
    headingElement.getBoundingClientRect().top -
    getScrollTopOffset();

  window.scrollTo({
    behavior: "smooth",
    top: Math.max(0, top),
  });
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

export const resolveActiveHeadingKey = (
  entries: readonly TableOfContentsEntry[],
  editor: LexicalEditor
): NodeKey | null => {
  let activeKey: NodeKey | null = null;

  for (const [key] of entries) {
    const element = editor.getElementByKey(key);
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    if (element.getBoundingClientRect().top <= ACTIVE_HEADING_TOP_OFFSET) {
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
