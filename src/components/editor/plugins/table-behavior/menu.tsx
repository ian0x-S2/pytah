import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Columns2Icon, Rows3Icon, Trash2Icon } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  deleteSelectedTable,
  deleteSelectedTableColumn,
  deleteSelectedTableRow,
  insertTableColumns,
  insertTableRows,
} from "./actions";
import type { SelectionCounts } from "./types";

interface TableActionMenuProps {
  onClose: () => void;
  selectionCounts: SelectionCounts;
}

export function TableActionMenu({
  onClose,
  selectionCounts,
}: TableActionMenuProps) {
  const [editor] = useLexicalComposerContext();

  const rowLabel =
    selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`;
  const columnLabel =
    selectionCounts.columns === 1
      ? "column"
      : `${selectionCounts.columns} columns`;

  return (
    <>
      <DropdownMenuItem
        onClick={() => {
          insertTableRows(editor, false, selectionCounts.rows);
          onClose();
          editor.focus();
        }}
      >
        <Rows3Icon />
        <span>Insert {rowLabel} above</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          insertTableRows(editor, true, selectionCounts.rows);
          onClose();
          editor.focus();
        }}
      >
        <Rows3Icon />
        <span>Insert {rowLabel} below</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          insertTableColumns(editor, false, selectionCounts.columns);
          onClose();
          editor.focus();
        }}
      >
        <Columns2Icon />
        <span>Insert {columnLabel} left</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          insertTableColumns(editor, true, selectionCounts.columns);
          onClose();
          editor.focus();
        }}
      >
        <Columns2Icon />
        <span>Insert {columnLabel} right</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          deleteSelectedTableRow(editor);
          onClose();
          editor.focus();
        }}
      >
        <Trash2Icon />
        <span>Delete row</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          deleteSelectedTableColumn(editor);
          onClose();
          editor.focus();
        }}
      >
        <Trash2Icon />
        <span>Delete column</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          deleteSelectedTable(editor);
          onClose();
          editor.focus();
        }}
        variant="destructive"
      >
        <Trash2Icon />
        <span>Delete table</span>
      </DropdownMenuItem>
    </>
  );
}
