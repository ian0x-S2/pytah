import { $createCodeNode } from "@lexical/code";
import { $createHorizontalRuleNode } from "@lexical/extension";
import {
  $createListItemNode,
  $createListNode,
  type ListType,
} from "@lexical/list";
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
} from "@lexical/table";
import {
  $createParagraphNode,
  $createTextNode,
  $isParagraphNode,
  type ElementNode,
} from "lexical";
import { DEFAULT_LAYOUT_TEMPLATE } from "../layout/constants";
import { applyLayoutPreset } from "../layout/utils";
import type { SlashCommandId } from "./types";

const replaceElementChildren = (
  targetElement: ElementNode,
  nextElement: ElementNode
) => {
  for (const child of targetElement.getChildren()) {
    nextElement.append(child);
  }

  targetElement.replace(nextElement);
};

const applyParagraphCommand = (targetElement: ElementNode) => {
  if ($isParagraphNode(targetElement)) {
    targetElement.selectEnd();
    return;
  }

  const paragraph = $createParagraphNode();
  replaceElementChildren(targetElement, paragraph);
  paragraph.selectEnd();
};

const applyHeadingCommand = (
  targetElement: ElementNode,
  headingTag: HeadingTagType
) => {
  const heading = $createHeadingNode(headingTag);
  replaceElementChildren(targetElement, heading);
  heading.selectEnd();
};

const applyQuoteCommand = (targetElement: ElementNode) => {
  const quote = $createQuoteNode();
  replaceElementChildren(targetElement, quote);
  quote.selectEnd();
};

const applyCodeCommand = (targetElement: ElementNode) => {
  const code = $createCodeNode();
  targetElement.replace(code);
  code.select();
};

const applyListCommand = (targetElement: ElementNode, listType: ListType) => {
  const list = $createListNode(listType);
  const item = $createListItemNode();

  for (const child of targetElement.getChildren()) {
    item.append(child);
  }

  list.append(item);
  targetElement.replace(list);
  item.selectEnd();
};

const createTableCell = (textContent: string, isHeader: boolean) => {
  const tableCell = $createTableCellNode(isHeader ? 1 : 0);
  const paragraph = $createParagraphNode();

  paragraph.append($createTextNode(textContent));
  tableCell.append(paragraph);

  return tableCell;
};

const applyTableCommand = (targetElement: ElementNode) => {
  const tableNode = $createTableNode();
  const headerRow = $createTableRowNode();
  const bodyRow = $createTableRowNode();

  headerRow.append(createTableCell("Column 1", true));
  headerRow.append(createTableCell("Column 2", true));
  headerRow.append(createTableCell("Column 3", true));

  bodyRow.append(createTableCell("", false));
  bodyRow.append(createTableCell("", false));
  bodyRow.append(createTableCell("", false));

  tableNode.append(headerRow);
  tableNode.append(bodyRow);

  targetElement.replace(tableNode);
  bodyRow.getFirstChild()?.selectEnd();
};

const applyDividerCommand = (targetElement: ElementNode) => {
  const horizontalRule = $createHorizontalRuleNode();
  const paragraph = $createParagraphNode();

  targetElement.replace(horizontalRule);
  horizontalRule.insertAfter(paragraph);
  paragraph.select();
};

const applyColumnsCommand = (targetElement: ElementNode) => {
  applyLayoutPreset(targetElement, DEFAULT_LAYOUT_TEMPLATE);
};

export const SLASH_COMMAND_EXECUTORS: Record<
  SlashCommandId,
  (element: ElementNode) => void
> = {
  bullet: (element) => applyListCommand(element, "bullet"),
  check: (element) => applyListCommand(element, "check"),
  code: applyCodeCommand,
  columns: applyColumnsCommand,
  h1: (element) => applyHeadingCommand(element, "h1"),
  h2: (element) => applyHeadingCommand(element, "h2"),
  h3: (element) => applyHeadingCommand(element, "h3"),
  hr: applyDividerCommand,
  number: (element) => applyListCommand(element, "number"),
  paragraph: applyParagraphCommand,
  quote: applyQuoteCommand,
  table: applyTableCommand,
};
