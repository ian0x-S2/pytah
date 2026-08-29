import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/extension";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import type { LexicalNodeList } from "./features";
import { editorTheme } from "./theme";

function onError(error: Error) {
  console.error("[Editor]", error);
}

/**
 * Lexical nodes that are always registered regardless of feature toggles.
 * Feature-owned nodes (image, youtube, math, collapsible, layout) are resolved
 * separately from the feature registry and appended through `featureNodes`.
 */
export const BASE_EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  TableNode,
  TableRowNode,
  TableCellNode,
];

interface CreateEditorConfigOptions {
  editable: boolean;
  /**
   * Initial-state builder run by LexicalComposer inside the very first
   * update, before any plugin mounts. Used to seed content synchronously
   * so the editor's first paint already contains the document.
   */
  editorState?: InitialConfigType["editorState"];
  /** Consumer-provided nodes appended after everything else. */
  extraNodes?: NonNullable<InitialConfigType["nodes"]>;
  /** Nodes contributed by enabled feature descriptors. */
  featureNodes?: LexicalNodeList;
  namespace?: string;
}

export const createEditorConfig = ({
  editable,
  editorState,
  namespace = "PytahEditor",
  featureNodes = [],
  extraNodes,
}: CreateEditorConfigOptions): InitialConfigType => {
  const nodes = [...BASE_EDITOR_NODES, ...featureNodes, ...(extraNodes ?? [])];

  return {
    editable,
    namespace,
    nodes,
    onError,
    theme: editorTheme,
    ...(editorState ? { editorState } : {}),
  };
};
