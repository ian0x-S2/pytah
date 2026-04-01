import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type ElementNode,
} from "lexical";
import { $createCollapsibleContainerNode } from "../../core/nodes/collapsible/container-node";
import { $createCollapsibleContentNode } from "../../core/nodes/collapsible/content-node";
import { $createCollapsibleTitleNode } from "../../core/nodes/collapsible/title-node";

const createCollapsibleStructure = () => {
  const titleParagraph = $createParagraphNode();
  const contentParagraph = $createParagraphNode();
  const titleNode = $createCollapsibleTitleNode();
  const contentNode = $createCollapsibleContentNode();
  const containerNode = $createCollapsibleContainerNode(true);

  titleNode.append(titleParagraph);
  contentNode.append(contentParagraph);
  containerNode.append(titleNode, contentNode);

  return {
    containerNode,
    titleParagraph,
  };
};

export const replaceElementWithCollapsible = (targetElement: ElementNode) => {
  const { containerNode, titleParagraph } = createCollapsibleStructure();
  targetElement.replace(containerNode);
  titleParagraph.selectEnd();
};

export const insertCollapsible = (targetNodeKey?: string) => {
  if (targetNodeKey) {
    const targetNode = $getNodeByKey(targetNodeKey);
    if (!$isElementNode(targetNode)) {
      return false;
    }

    replaceElementWithCollapsible(targetNode);
    return true;
  }

  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const targetElement = selection.anchor
      .getNode()
      .getTopLevelElementOrThrow();
    replaceElementWithCollapsible(targetElement);
    return true;
  }

  const { containerNode, titleParagraph } = createCollapsibleStructure();
  $insertNodeToNearestRoot(containerNode);
  titleParagraph.selectEnd();
  return true;
};
