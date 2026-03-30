import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableSelection,
  type TableSelection,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  isDOMNode,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  ChevronDownIcon,
  Columns2Icon,
  Rows3Icon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SelectionCounts {
  columns: number;
  rows: number;
}

interface ButtonPosition {
  left: number;
  top: number;
}

interface TableMenuContext {
  position: ButtonPosition;
  selectionCounts: SelectionCounts;
}

const DEFAULT_SELECTION_COUNTS: SelectionCounts = {
  columns: 1,
  rows: 1,
};

const resolveSelectionCounts = (
  selection: ReturnType<typeof $getSelection>
): SelectionCounts => {
  if (!$isTableSelection(selection)) {
    return DEFAULT_SELECTION_COUNTS;
  }

  const shape = (selection as TableSelection).getShape();
  return {
    columns: shape.toX - shape.fromX + 1,
    rows: shape.toY - shape.fromY + 1,
  };
};

const readTableMenuContext = (
  editor: LexicalEditor,
  anchorElem: HTMLElement
): TableMenuContext | null => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) || $isTableSelection(selection))) {
    return null;
  }

  const tableCellNode = $getTableCellNodeFromLexicalNode(
    selection.anchor.getNode()
  );
  if (!tableCellNode?.isAttached()) {
    return null;
  }

  const tableCellElement = editor.getElementByKey(tableCellNode.getKey());
  if (!tableCellElement) {
    return null;
  }

  const cellRect = tableCellElement.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();

  return {
    position: {
      left: cellRect.right - anchorRect.left - 26,
      top: cellRect.top - anchorRect.top + 6,
    },
    selectionCounts: resolveSelectionCounts(selection),
  };
};

function TableActionMenu({
  onClose,
  selectionCounts,
}: {
  onClose: () => void;
  selectionCounts: SelectionCounts;
}) {
  const [editor] = useLexicalComposerContext();

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const insertRows = useCallback(
    (insertAfter: boolean) => {
      editor.update(() => {
        for (let index = 0; index < selectionCounts.rows; index += 1) {
          $insertTableRowAtSelection(insertAfter);
        }
      });
      onClose();
    },
    [editor, onClose, selectionCounts.rows]
  );

  const insertColumns = useCallback(
    (insertAfter: boolean) => {
      editor.update(() => {
        for (let index = 0; index < selectionCounts.columns; index += 1) {
          $insertTableColumnAtSelection(insertAfter);
        }
      });
      onClose();
    },
    [editor, onClose, selectionCounts.columns]
  );

  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
    });
    onClose();
  }, [editor, onClose]);

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
    });
    onClose();
  }, [editor, onClose]);

  const deleteTable = useCallback(() => {
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
    onClose();
  }, [editor, onClose]);

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
        onClick={() => insertRows(false)}
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
        onClick={() => insertRows(true)}
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
        onClick={() => insertColumns(false)}
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
        onClick={() => insertColumns(true)}
        onMouseDown={handleMouseDown}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Columns2Icon />
        <span>Insert {columnLabel} right</span>
      </Button>
      <div className="my-1 h-px bg-border" />
      <Button
        className="justify-start"
        onClick={deleteRow}
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
        onClick={deleteColumn}
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
        onClick={deleteTable}
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

function TableCellActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ButtonPosition>({ left: 0, top: 0 });
  const [selectionCounts, setSelectionCounts] = useState<SelectionCounts>(
    DEFAULT_SELECTION_COUNTS
  );

  const updateMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);
      if (!context) {
        setIsVisible(false);
        setIsMenuOpen(false);
        setSelectionCounts(DEFAULT_SELECTION_COUNTS);
        return;
      }

      setPosition(context.position);
      setSelectionCounts(context.selectionCounts);
      setIsVisible(true);
    });
  }, [anchorElem, editor]);

  useEffect(() => {
    const onPointerUp = () => {
      window.setTimeout(updateMenu, 0);
    };

    updateMenu();

    return mergeRegister(
      editor.registerUpdateListener(() => {
        updateMenu();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateMenu();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerRootListener((rootElement, previousRootElement) => {
        previousRootElement?.removeEventListener("pointerup", onPointerUp);
        rootElement?.addEventListener("pointerup", onPointerUp);
      })
    );
  }, [editor, updateMenu]);

  useEffect(() => {
    window.addEventListener("resize", updateMenu);
    window.addEventListener("scroll", updateMenu, true);

    return () => {
      window.removeEventListener("resize", updateMenu);
      window.removeEventListener("scroll", updateMenu, true);
    };
  }, [updateMenu]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target && isDOMNode(target))) {
        return;
      }

      const menuRoot = anchorElem.querySelector(
        "[data-table-actions-root='true']"
      );
      if (menuRoot?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [anchorElem, isMenuOpen]);

  return createPortal(
    <div
      className={
        isVisible ? "absolute z-40" : "pointer-events-none absolute z-40 hidden"
      }
      data-table-actions-root="true"
      style={{ left: position.left, top: position.top }}
    >
      <Popover onOpenChange={setIsMenuOpen} open={isMenuOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label="Open table actions"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              size="icon-xs"
              variant="outline"
            />
          }
        >
          <ChevronDownIcon className="size-3" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-56 p-0"
          side="right"
          sideOffset={8}
        >
          <TableActionMenu
            onClose={() => setIsMenuOpen(false)}
            selectionCounts={selectionCounts}
          />
        </PopoverContent>
      </Popover>
    </div>,
    anchorElem
  );
}

export function TableBehaviorPlugin() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      setAnchorElem(rootElement?.parentElement ?? null);
    });
  }, [editor]);

  return (
    <>
      <TablePlugin hasCellBackgroundColor={false} hasHorizontalScroll />
      {isEditable && anchorElem ? (
        <TableCellActionMenuContainer anchorElem={anchorElem} />
      ) : null}
    </>
  );
}
