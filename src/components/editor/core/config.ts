import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/extension";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { LayoutContainerNode } from "./nodes/layout-container-node";
import { LayoutItemNode } from "./nodes/layout-item-node";
import { editorTheme } from "./theme";

function onError(error: Error) {
  console.error("[Editor]", error);
}

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  LayoutContainerNode,
  LayoutItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
];

export const createEditorConfig = (editable: boolean): InitialConfigType => {
  return {
    editable,
    namespace: "PytahEditor",
    nodes: EDITOR_NODES,
    onError,
    theme: editorTheme,
  };
};
