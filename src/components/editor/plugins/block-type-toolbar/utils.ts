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
  $isParagraphNode,
  $isRangeSelection,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { DEFAULT_INSERT_TABLE_PAYLOAD } from "../table-behavior/constants";
import type { BlockOption, BlockTypeValue } from "./types";

const HEADING_VALUES = ["h1", "h2", "h3"] as const;

const isHeadingValue = (
  value: BlockTypeValue
): value is (typeof HEADING_VALUES)[number] => {
  return HEADING_VALUES.includes(value as (typeof HEADING_VALUES)[number]);
};

const findSelectedTableAncestor = (node: LexicalNode) => {
  return $findMatchingParent(node, (parentNode) => $isTableNode(parentNode));
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

  const topLevelElement = anchorNode.getTopLevelElementOrThrow();

  if ($isHeadingNode(topLevelElement)) {
    const headingTag = topLevelElement.getTag();
    if (headingTag === "h1" || headingTag === "h2" || headingTag === "h3") {
      return headingTag;
    }

    return null;
  }

  if ($isQuoteNode(topLevelElement)) {
    return "quote";
  }

  if ($isCodeNode(topLevelElement)) {
    return "code";
  }

  if ($isListNode(topLevelElement)) {
    const listType = topLevelElement.getListType();
    if (
      listType === "bullet" ||
      listType === "number" ||
      listType === "check"
    ) {
      return listType;
    }

    return null;
  }

  if ($isParagraphNode(topLevelElement)) {
    return "paragraph";
  }

  return null;
};

export const applyBlockType = (
  editor: LexicalEditor,
  blockType: BlockTypeValue
) => {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    if (blockType === "paragraph") {
      $setBlocksType(selection, () => $createParagraphNode());
      return;
    }

    if (isHeadingValue(blockType)) {
      $setBlocksType(selection, () => $createHeadingNode(blockType));
      return;
    }

    if (blockType === "quote") {
      $setBlocksType(selection, () => $createQuoteNode());
      return;
    }

    if (blockType === "code") {
      $setBlocksType(selection, () => $createCodeNode());
      return;
    }

    if (blockType === "table") {
      editor.dispatchCommand(
        INSERT_TABLE_COMMAND,
        DEFAULT_INSERT_TABLE_PAYLOAD
      );
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
): BlockOption => {
  return (
    options.find((option) => option.value === currentBlockType) ?? options[0]
  );
};
