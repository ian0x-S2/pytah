import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Columns2Icon, Rows3Icon, Trash2Icon } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const rowLabel =
    selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`;
  const columnLabel =
    selectionCounts.columns === 1
      ? "column"
      : `${selectionCounts.columns} columns`;

  return (
    <div className="flex w-56 flex-col gap-1 p-1">
      <Button
        className="justify-start"
        onClick={() => {
          insertTableRows(editor, false, selectionCounts.rows);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Rows3Icon />
        <span>Insert {rowLabel} above</span>
      </Button>
      <Button
        className="justify-start"
        onClick={() => {
          insertTableRows(editor, true, selectionCounts.rows);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Rows3Icon />
        <span>Insert {rowLabel} below</span>
      </Button>
      <Button
        className="justify-start"
        onClick={() => {
          insertTableColumns(editor, false, selectionCounts.columns);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Columns2Icon />
        <span>Insert {columnLabel} left</span>
      </Button>
      <Button
        className="justify-start"
        onClick={() => {
          insertTableColumns(editor, true, selectionCounts.columns);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Columns2Icon />
        <span>Insert {columnLabel} right</span>
      </Button>
      <Separator className="my-1" />
      <Button
        className="justify-start"
        onClick={() => {
          deleteSelectedTableRow(editor);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Trash2Icon />
        <span>Delete row</span>
      </Button>
      <Button
        className="justify-start"
        onClick={() => {
          deleteSelectedTableColumn(editor);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Trash2Icon />
        <span>Delete column</span>
      </Button>
      <Button
        className="justify-start text-destructive hover:text-destructive"
        onClick={() => {
          deleteSelectedTable(editor);
          onClose();
        }}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Trash2Icon />
        <span>Delete table</span>
      </Button>
    </div>
  );
}
