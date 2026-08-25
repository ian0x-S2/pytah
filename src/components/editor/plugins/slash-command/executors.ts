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
import type { FeatureSlashCommand, SlashCommandId } from "./types";
import { replaceCurrentBlock } from "./utils";

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

/**
 * Core-owned executors. Feature-scoped executors live beside their features
 * and reach the menu through their descriptor's `run` instead.
 */
export const CORE_SLASH_COMMAND_EXECUTORS: Record<
  SlashCommandId,
  ((element: ElementNode) => void) | undefined
> = {
  bullet: (element) => applyListCommand(element, "bullet"),
  check: (element) => applyListCommand(element, "check"),
  code: applyCodeCommand,
  collapsible: undefined,
  columns: undefined,
  excalidraw: undefined,
  h1: (element) => applyHeadingCommand(element, "h1"),
  h2: (element) => applyHeadingCommand(element, "h2"),
  h3: (element) => applyHeadingCommand(element, "h3"),
  hr: applyDividerCommand,
  image: undefined,
  math: undefined,
  number: (element) => applyListCommand(element, "number"),
  paragraph: applyParagraphCommand,
  quote: applyQuoteCommand,
  table: applyTableCommand,
  youtube: undefined,
};

/**
 * Runtime registry for feature-contributed command runs. The composition
 * surface registers every installed extra's contributions at mount time, so
 * core surfaces (slash menu, toolbar dropdowns) can execute feature actions
 * without importing any feature module statically.
 */
const featureRunners = new Map<string, FeatureSlashCommand["run"]>();

export const registerSlashRunner = (
  id: string,
  run: FeatureSlashCommand["run"]
): void => {
  featureRunners.set(id, run);
};

export const unregisterSlashRunner = (id: string): void => {
  featureRunners.delete(id);
};

export const getSlashRunner = (
  id: string
): FeatureSlashCommand["run"] | undefined => {
  const featureRun = featureRunners.get(id);
  if (featureRun) {
    return featureRun;
  }

  const executor = CORE_SLASH_COMMAND_EXECUTORS[id as SlashCommandId];
  if (!executor) {
    return undefined;
  }

  return (editor) => {
    replaceCurrentBlock(editor, executor);
  };
};
