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
        <Rows3Icon aria-hidden />
        <span>Insert {rowLabel} above</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          insertTableRows(editor, true, selectionCounts.rows);
          onClose();
          editor.focus();
        }}
      >
        <Rows3Icon aria-hidden />
        <span>Insert {rowLabel} below</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          insertTableColumns(editor, false, selectionCounts.columns);
          onClose();
          editor.focus();
        }}
      >
        <Columns2Icon aria-hidden />
        <span>Insert {columnLabel} left</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          insertTableColumns(editor, true, selectionCounts.columns);
          onClose();
          editor.focus();
        }}
      >
        <Columns2Icon aria-hidden />
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
        <Trash2Icon aria-hidden />
        <span>Delete {rowLabel}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          deleteSelectedTableColumn(editor);
          onClose();
          editor.focus();
        }}
      >
        <Trash2Icon aria-hidden />
        <span>Delete {columnLabel}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          deleteSelectedTable(editor);
          onClose();
          editor.focus();
        }}
        variant="destructive"
      >
        <Trash2Icon aria-hidden />
        <span>Delete table</span>
      </DropdownMenuItem>
    </>
  );
}
