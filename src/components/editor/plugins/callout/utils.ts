import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
} from "lexical";
import type { ElementNode } from "lexical";

import { $createCalloutNode } from "../../core/nodes/callout/node";
import type { CalloutType } from "../../core/nodes/callout/node";

export const createCalloutStructure = (
  type: CalloutType = "note",
  emoji?: string
) => {
  const paragraph = $createParagraphNode();
  const calloutNode = $createCalloutNode(type, emoji);
  calloutNode.append(paragraph);
  return {
    calloutNode,
    paragraph,
  };
};

export const replaceElementWithCallout = (
  targetElement: ElementNode,
  type: CalloutType = "note",
  emoji?: string
) => {
  const calloutNode = $createCalloutNode(type, emoji);
  const children = targetElement.getChildren();
  if (children.length > 0) {
    for (const child of children) {
      calloutNode.append(child);
    }
  } else {
    calloutNode.append($createParagraphNode());
  }
  targetElement.replace(calloutNode);
  calloutNode.selectEnd();
};

export const insertCallout = (
  type: CalloutType = "note",
  emoji?: string,
  targetNodeKey?: string
) => {
  if (targetNodeKey) {
    const targetNode = $getNodeByKey(targetNodeKey);
    if (!$isElementNode(targetNode)) {
      return false;
    }
    replaceElementWithCallout(targetNode, type, emoji);
    return true;
  }

  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const targetElement = selection.anchor
      .getNode()
      .getTopLevelElementOrThrow();
    replaceElementWithCallout(targetElement, type, emoji);
    return true;
  }

  const { calloutNode, paragraph } = createCalloutStructure(type, emoji);
  $insertNodeToNearestRoot(calloutNode);
  paragraph.selectEnd();
  return true;
};
