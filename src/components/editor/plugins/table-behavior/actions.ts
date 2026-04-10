import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableSelection,
} from "@lexical/table";
import { $getSelection, $isRangeSelection, type LexicalEditor } from "lexical";

export const insertTableRow = (editor: LexicalEditor, insertAfter: boolean) => {
  editor.update(() => {
    $insertTableRowAtSelection(insertAfter);
  });
};

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

export const insertTableColumn = (
  editor: LexicalEditor,
  insertAfter: boolean
) => {
  editor.update(() => {
    $insertTableColumnAtSelection(insertAfter);
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

    $getTableNodeFromLexicalNodeOrThrow(tableCellNode).remove();
  });
};
