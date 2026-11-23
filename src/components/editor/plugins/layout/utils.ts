import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $createParagraphNode } from "lexical";
import type { ElementNode } from "lexical";

import { $createLayoutContainerNode } from "../../core/nodes/layout/container-node";
import { $createLayoutItemNode } from "../../core/nodes/layout/item-node";

const REPEAT_PREFIX_PATTERN = /^repeat\(\s*(?<count>\d+)\s*,/iu;

const readBalancedParensEnd = (value: string, openIndex: number): number => {
  let depth = 0;
  for (let index = openIndex; index < value.length; index += 1) {
    const char = value[index];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return value.length - 1;
};

export const getLayoutColumnCount = (templateColumns: string): number => {
  const trimmed = templateColumns.trim();
  if (!trimmed) {
    return 1;
  }

  let count = 0;
  let index = 0;

  while (index < trimmed.length) {
    while (index < trimmed.length && /\s/u.test(trimmed[index])) {
      index += 1;
    }
    if (index >= trimmed.length) {
      break;
    }

    const slice = trimmed.slice(index);
    const repeatMatch = REPEAT_PREFIX_PATTERN.exec(slice);
    if (repeatMatch) {
      const repeatCount = Math.trunc(Number(repeatMatch.groups?.count ?? "0"));
      if (Number.isFinite(repeatCount) && repeatCount > 0) {
        count += repeatCount;
      }
      const openIndex = trimmed.indexOf("(", index);
      index = readBalancedParensEnd(trimmed, openIndex) + 1;
      continue;
    }

    // Consume one top-level track token (respecting nested parentheses such as minmax(0, 1fr)).
    let depth = 0;
    while (index < trimmed.length) {
      const char = trimmed[index];
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth = Math.max(0, depth - 1);
      } else if (depth === 0 && /\s/u.test(char)) {
        break;
      }
      index += 1;
    }
    count += 1;
  }

  return Math.max(1, count);
};

export const createLayoutContainer = (templateColumns: string) => {
  const layoutContainer = $createLayoutContainerNode(templateColumns);
  const columnCount = getLayoutColumnCount(templateColumns);
  let firstParagraph: ReturnType<typeof $createParagraphNode> | null = null;

  for (let index = 0; index < columnCount; index += 1) {
    const layoutItem = $createLayoutItemNode();
    const paragraph = $createParagraphNode();

    if (firstParagraph === null) {
      firstParagraph = paragraph;
    }

    layoutItem.append(paragraph);
    layoutContainer.append(layoutItem);
  }

  return { firstParagraph, layoutContainer };
};

export const applyLayoutPreset = (
  targetElement: ElementNode,
  templateColumns: string
) => {
  const { firstParagraph, layoutContainer } =
    createLayoutContainer(templateColumns);

  targetElement.replace(layoutContainer);
  if (!layoutContainer.getNextSibling()) {
    layoutContainer.insertAfter($createParagraphNode());
  }
  firstParagraph?.selectEnd();
};

export const insertLayoutPreset = (templateColumns: string) => {
  const { firstParagraph, layoutContainer } =
    createLayoutContainer(templateColumns);

  $insertNodeToNearestRoot(layoutContainer);
  if (!layoutContainer.getNextSibling()) {
    layoutContainer.insertAfter($createParagraphNode());
  }
  firstParagraph?.selectEnd();
};
