import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
} from "@lexical/table";
import type { LexicalEditor } from "lexical";

export const insertTableRow = (editor: LexicalEditor, insertAfter: boolean) => {
  editor.update(() => {
    $insertTableRowAtSelection(insertAfter);
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
