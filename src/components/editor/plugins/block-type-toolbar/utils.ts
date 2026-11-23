import { $createCodeNode, $isCodeNode } from "@lexical/code";
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $isTableNode, INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  $createParagraphNode,
  $findMatchingParent,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
} from "lexical";
import type {
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
} from "lexical";

import { getCoreSlashRunner } from "../slash-command/executors";
import type { FeatureSlashCommand } from "../slash-command/types";
import type { BlockOption, BlockTypeValue } from "./types";

const HEADING_VALUES = ["h1", "h2", "h3"] as const;

const isHeadingValue = (
  value: BlockTypeValue
): value is (typeof HEADING_VALUES)[number] =>
  HEADING_VALUES.includes(value as (typeof HEADING_VALUES)[number]);

const findSelectedTableAncestor = (node: LexicalNode) =>
  $findMatchingParent(node, (parentNode) => $isTableNode(parentNode));

export const getElementFormatFromSelection = (): ElementFormatType => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return "";
  }

  const topLevelElement = selection.anchor.getNode().getTopLevelElement();
  if (topLevelElement && $isElementNode(topLevelElement)) {
    return topLevelElement.getFormatType();
  }

  return "";
};

const resolveCalloutBlockType = (element: LexicalNode): BlockTypeValue => {
  const calloutType =
    "getCalloutType" in element && typeof element.getCalloutType === "function"
      ? (element.getCalloutType() as string)
      : "note";

  if (
    calloutType === "info" ||
    calloutType === "tip" ||
    calloutType === "warning" ||
    calloutType === "caution"
  ) {
    return calloutType;
  }

  return "callout";
};

export const getBlockTypeFromSelection = (): BlockTypeValue | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();

  if (findSelectedTableAncestor(anchorNode)) {
    return "table";
  }

  const topLevelElement = anchorNode.getTopLevelElement();
  if (!topLevelElement) {
    return null;
  }

  if (topLevelElement.getType() === "callout") {
    return resolveCalloutBlockType(topLevelElement);
  }

  if ($isHeadingNode(topLevelElement)) {
    const headingTag = topLevelElement.getTag();
    return headingTag === "h1" || headingTag === "h2" || headingTag === "h3"
      ? headingTag
      : "h3";
  }

  if ($isQuoteNode(topLevelElement)) {
    return "quote";
  }

  if ($isCodeNode(topLevelElement)) {
    return "code";
  }

  if ($isListNode(topLevelElement)) {
    const listType = topLevelElement.getListType();
    return listType === "bullet" ||
      listType === "number" ||
      listType === "check"
      ? listType
      : null;
  }

  if ($isParagraphNode(topLevelElement)) {
    return "paragraph";
  }

  return null;
};

const $applyConversionBlockType = (
  selection: RangeSelection,
  blockType: BlockTypeValue
): boolean => {
  if (blockType === "paragraph") {
    $setBlocksType(selection, () => $createParagraphNode());
    return true;
  }

  if (isHeadingValue(blockType)) {
    $setBlocksType(selection, () => $createHeadingNode(blockType));
    return true;
  }

  if (blockType === "quote") {
    $setBlocksType(selection, () => $createQuoteNode());
    return true;
  }

  if (blockType === "code") {
    $setBlocksType(selection, () => $createCodeNode());
    return true;
  }

  return false;
};

export const applyBlockType = (
  editor: LexicalEditor,
  blockType: BlockTypeValue,
  commandRunner?: FeatureSlashCommand["run"]
) => {
  const isBuiltinConversion =
    blockType === "paragraph" ||
    isHeadingValue(blockType) ||
    blockType === "quote" ||
    blockType === "code" ||
    blockType === "bullet" ||
    blockType === "number" ||
    blockType === "check";

  if (!isBuiltinConversion) {
    const run = commandRunner ?? getCoreSlashRunner(blockType);
    if (run) {
      run(editor);
      return;
    }
  }

  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    if ($applyConversionBlockType(selection, blockType)) {
      return;
    }

    if (blockType === "table") {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        columns: "3",
        includeHeaders: true,
        rows: "3",
      });
      return;
    }

    if (
      blockType !== "bullet" &&
      blockType !== "check" &&
      blockType !== "number"
    ) {
      return;
    }

    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);

    if (blockType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    }

    if (blockType === "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      return;
    }

    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  });
};

export const getCurrentBlockOption = (
  currentBlockType: BlockTypeValue,
  options: BlockOption[]
): BlockOption =>
  options.find((option) => option.value === currentBlockType) ?? options[0];
