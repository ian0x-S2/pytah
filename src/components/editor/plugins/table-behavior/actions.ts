import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableSelection,
} from "@lexical/table";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import type { LexicalEditor } from "lexical";

export const insertTableRows = (
  editor: LexicalEditor,
  insertAfter: boolean,
  count: number
) => {
  editor.update(() => {
    for (let index = 0; index < count; index += 1) {
      $insertTableRowAtSelection(insertAfter);
    }
  });
};

export const insertTableColumns = (
  editor: LexicalEditor,
  insertAfter: boolean,
  count: number
) => {
  editor.update(() => {
    for (let index = 0; index < count; index += 1) {
      $insertTableColumnAtSelection(insertAfter);
    }
  });
};

export const deleteSelectedTableRow = (editor: LexicalEditor) => {
  editor.update(() => {
    $deleteTableRowAtSelection();
  });
};

export const deleteSelectedTableColumn = (editor: LexicalEditor) => {
  editor.update(() => {
    $deleteTableColumnAtSelection();
  });
};

export const deleteSelectedTable = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection();
    if (!($isRangeSelection(selection) || $isTableSelection(selection))) {
      return;
    }

    const tableCellNode = $getTableCellNodeFromLexicalNode(
      selection.anchor.getNode()
    );
    if (!tableCellNode) {
      return;
    }

    const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
    const nextSibling = tableNode.getNextSibling();
    const prevSibling = tableNode.getPreviousSibling();
    tableNode.remove();

    if ($getRoot().getChildrenSize() === 0) {
      const paragraph = $createParagraphNode();
      $getRoot().append(paragraph);
      paragraph.select();
    } else if (nextSibling) {
      nextSibling.selectStart();
    } else if (prevSibling) {
      prevSibling.selectEnd();
    }
  });
};
