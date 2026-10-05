import type { CodeNode } from "@lexical/code";
import { $isCodeNode } from "@lexical/code";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  SELECT_ALL_COMMAND,
} from "lexical";
import type { LexicalEditor, LexicalNode } from "lexical";

/**
 * Resolves the CodeNode a select-all should stay inside: the first ancestor
 * chain (anchor first, then focus) that reaches a CodeNode. Element points on
 * the CodeNode itself (line-break anchors) resolve directly; text points
 * inside highlight nodes walk up to it.
 */
const $getCodeNodeFromSelection = (): CodeNode | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  for (const point of [selection.anchor, selection.focus]) {
    let node: LexicalNode | null = point.getNode();
    while (node !== null) {
      if ($isCodeNode(node)) {
        return node;
      }
      node = node.getParent();
    }
  }
  return null;
};

/**
 * Selects the full content of the code block with text points on its
 * selectable leaves (text, tabs) — anchor before the first, focus after the
 * last — so the selection cannot escape the block once the DOM selection
 * round-trips. Falls back to collapsing on the block when it has no
 * selectable children.
 */
const $selectAllInCodeNode = (node: CodeNode): void => {
  const children = node.getChildren();
  for (const child of children) {
    if ($isTextNode(child)) {
      child.select(0, 0);
      break;
    }
  }
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index];
    if (child && $isTextNode(child)) {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.focus.set(child.getKey(), child.getTextContentSize(), "text");
      }
      return;
    }
  }
  node.select(0, 0);
};

/**
 * Registers the scoped select-all handler: Ctrl/Cmd+A with any selection
 * endpoint inside a code block selects exactly that block's content instead
 * of the whole document. Exported separately from the React plugin so
 * headless editors (and tests) can wire the same behavior.
 */
export function registerCodeSelectAll(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    SELECT_ALL_COMMAND,
    () => {
      const codeNode = $getCodeNodeFromSelection();
      if (codeNode === null) {
        // No code block under the selection: fall through to the rich-text
        // core's select-all (whole document).
        return false;
      }
      $selectAllInCodeNode(codeNode);
      return true;
    },
    COMMAND_PRIORITY_HIGH
  );
}
