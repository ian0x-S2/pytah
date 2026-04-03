import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";

export function TableBehaviorGuidePage() {
  return (
    <>
      <PageHeader
        description="Walkthrough of the table plugin: the base Lexical TablePlugin wrapper, the floating action-menu button anchored to the active cell, and the table-mutation helpers."
        title="Table Behavior"
      />

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/plugins/table-behavior/",
          "  actions.ts   ← insert/delete row & column helpers",
          "  plugin.tsx   ← TableBehaviorPlugin, TableCellActionMenuContainer, TableActionMenu",
        ]}
      />

      <Callout title="Depends on @lexical/table" variant="info">
        <code>TableBehaviorPlugin</code> composes the official{" "}
        <code>{"<TablePlugin>"}</code> from{" "}
        <code>@lexical/react/LexicalTablePlugin</code>. No custom table nodes
        are needed — the plugin adds the floating action-menu UI on top.
      </Callout>

      <SectionHeading id="actions">actions.ts</SectionHeading>
      <Paragraph>
        Thin wrappers around the <code>@lexical/table</code> mutations. These
        are kept separate so they can be called from outside the plugin (e.g.
        from a toolbar).
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/table-behavior/actions.ts">
        {`import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
} from "@lexical/table";
import type { LexicalEditor } from "lexical";

export const insertTableRow = (editor: LexicalEditor, insertAfter: boolean) => {
  editor.update(() => { $insertTableRowAtSelection(insertAfter); });
};

export const insertTableColumn = (editor: LexicalEditor, insertAfter: boolean) => {
  editor.update(() => { $insertTableColumnAtSelection(insertAfter); });
};

export const deleteSelectedTableRow = (editor: LexicalEditor) => {
  editor.update(() => { $deleteTableRowAtSelection(); });
};

export const deleteSelectedTableColumn = (editor: LexicalEditor) => {
  editor.update(() => { $deleteTableColumnAtSelection(); });
};`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        Three components in one file. <code>TableBehaviorPlugin</code> is the
        public entry point — it renders <code>{"<TablePlugin>"}</code> and
        conditionally mounts the action-menu container.{" "}
        <code>TableCellActionMenuContainer</code> listens for selection changes
        and positions a small chevron button at the active cell.{" "}
        <code>TableActionMenu</code> is the popover content with insert/delete
        actions.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/table-behavior/plugin.tsx">
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $deleteTableColumnAtSelection, $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode, $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection, $insertTableRowAtSelection,
  $isTableSelection, type TableSelection,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection, $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL, isDOMNode,
  type LexicalEditor, SELECTION_CHANGE_COMMAND,
} from "lexical";
import { ChevronDownIcon, Columns2Icon, Rows3Icon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// ---- types ----
interface SelectionCounts { columns: number; rows: number; }
interface ButtonPosition { left: number; top: number; }
interface TableMenuContext { position: ButtonPosition; selectionCounts: SelectionCounts; }
const DEFAULT_SELECTION_COUNTS: SelectionCounts = { columns: 1, rows: 1 };

// ---- helpers ----
const resolveSelectionCounts = (selection: ReturnType<typeof $getSelection>): SelectionCounts => {
  if (!$isTableSelection(selection)) return DEFAULT_SELECTION_COUNTS;
  const shape = (selection as TableSelection).getShape();
  return { columns: shape.toX - shape.fromX + 1, rows: shape.toY - shape.fromY + 1 };
};

const readTableMenuContext = (editor: LexicalEditor, anchorElem: HTMLElement): TableMenuContext | null => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) || $isTableSelection(selection))) return null;
  const tableCellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
  if (!tableCellNode?.isAttached()) return null;
  const tableCellElement = editor.getElementByKey(tableCellNode.getKey());
  if (!tableCellElement) return null;
  const cellRect = tableCellElement.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();
  const buttonSize = 20;
  return {
    position: {
      left: cellRect.right - anchorRect.left - buttonSize - 6,
      top: cellRect.top - anchorRect.top + Math.round((cellRect.height - buttonSize) / 2),
    },
    selectionCounts: resolveSelectionCounts(selection),
  };
};

// ---- TableActionMenu ----
function TableActionMenu({
  onClose, selectionCounts,
}: { onClose: () => void; selectionCounts: SelectionCounts }) {
  const [editor] = useLexicalComposerContext();
  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
  };
  const insertRows = useCallback((insertAfter: boolean) => {
    editor.update(() => {
      for (let i = 0; i < selectionCounts.rows; i++) $insertTableRowAtSelection(insertAfter);
    });
    onClose();
  }, [editor, onClose, selectionCounts.rows]);
  const insertColumns = useCallback((insertAfter: boolean) => {
    editor.update(() => {
      for (let i = 0; i < selectionCounts.columns; i++) $insertTableColumnAtSelection(insertAfter);
    });
    onClose();
  }, [editor, onClose, selectionCounts.columns]);
  const deleteRow = useCallback(() => { editor.update(() => { $deleteTableRowAtSelection(); }); onClose(); }, [editor, onClose]);
  const deleteColumn = useCallback(() => { editor.update(() => { $deleteTableColumnAtSelection(); }); onClose(); }, [editor, onClose]);
  const deleteTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!($isRangeSelection(selection) || $isTableSelection(selection))) return;
      const tableCellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (!tableCellNode) return;
      $getTableNodeFromLexicalNodeOrThrow(tableCellNode).remove();
    });
    onClose();
  }, [editor, onClose]);

  const rowLabel = selectionCounts.rows === 1 ? "row" : \`\${selectionCounts.rows} rows\`;
  const columnLabel = selectionCounts.columns === 1 ? "column" : \`\${selectionCounts.columns} columns\`;

  return (
    <div className="flex w-56 flex-col gap-1 p-1">
      <Button className="justify-start" onClick={() => insertRows(false)} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Rows3Icon /><span>Insert {rowLabel} above</span>
      </Button>
      <Button className="justify-start" onClick={() => insertRows(true)} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Rows3Icon /><span>Insert {rowLabel} below</span>
      </Button>
      <Button className="justify-start" onClick={() => insertColumns(false)} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Columns2Icon /><span>Insert {columnLabel} left</span>
      </Button>
      <Button className="justify-start" onClick={() => insertColumns(true)} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Columns2Icon /><span>Insert {columnLabel} right</span>
      </Button>
      <Separator className="my-1" />
      <Button className="justify-start" onClick={deleteRow} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Trash2Icon /><span>Delete row</span>
      </Button>
      <Button className="justify-start" onClick={deleteColumn} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Trash2Icon /><span>Delete column</span>
      </Button>
      <Button className="justify-start text-destructive hover:text-destructive" onClick={deleteTable} onMouseDown={handleMouseDown} size="sm" type="button" variant="ghost">
        <Trash2Icon /><span>Delete table</span>
      </Button>
    </div>
  );
}

// ---- TableCellActionMenuContainer ----
function TableCellActionMenuContainer({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ButtonPosition>({ left: 0, top: 0 });
  const [selectionCounts, setSelectionCounts] = useState<SelectionCounts>(DEFAULT_SELECTION_COUNTS);

  const updateMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const context = readTableMenuContext(editor, anchorElem);
      if (!context) { setIsVisible(false); setIsMenuOpen(false); setSelectionCounts(DEFAULT_SELECTION_COUNTS); return; }
      setPosition(context.position);
      setSelectionCounts(context.selectionCounts);
      setIsVisible(true);
    });
  }, [anchorElem, editor]);

  useEffect(() => {
    const onPointerUp = () => { window.setTimeout(updateMenu, 0); };
    updateMenu();
    return mergeRegister(
      editor.registerUpdateListener(() => { updateMenu(); }),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { updateMenu(); return false; }, COMMAND_PRIORITY_CRITICAL),
      editor.registerRootListener((rootElement, previousRootElement) => {
        previousRootElement?.removeEventListener("pointerup", onPointerUp);
        rootElement?.addEventListener("pointerup", onPointerUp);
      })
    );
  }, [editor, updateMenu]);

  useEffect(() => {
    window.addEventListener("resize", updateMenu);
    window.addEventListener("scroll", updateMenu, true);
    return () => { window.removeEventListener("resize", updateMenu); window.removeEventListener("scroll", updateMenu, true); };
  }, [updateMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target && isDOMNode(target))) return;
      const menuRoot = anchorElem.querySelector("[data-table-actions-root='true']");
      if (menuRoot?.contains(target)) return;
      setIsMenuOpen(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => { window.removeEventListener("click", handleClickOutside); };
  }, [anchorElem, isMenuOpen]);

  return createPortal(
    <div
      className={isVisible ? "absolute z-40" : "pointer-events-none absolute z-40 hidden"}
      data-table-actions-root="true"
      style={{ left: position.left, top: position.top }}
    >
      <Popover onOpenChange={setIsMenuOpen} open={isMenuOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label="Open table actions"
              className="size-5"
              onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
              size="icon-xs"
              variant="outline"
            />
          }
        >
          <ChevronDownIcon className="size-2.5" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0" side="right" sideOffset={8}>
          <TableActionMenu onClose={() => setIsMenuOpen(false)} selectionCounts={selectionCounts} />
        </PopoverContent>
      </Popover>
    </div>,
    anchorElem
  );
}

// ---- Public plugin ----
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
}`}
      </CodeBlock>

      <SubHeading>Registration</SubHeading>
      <CodeBlock language="tsx">
        {`// ui/content.tsx
import { TableBehaviorPlugin } from "../plugins/table-behavior/plugin";
<TableBehaviorPlugin />`}
      </CodeBlock>

      <Callout title="Anchor element" variant="tip">
        The action-menu portal renders inside <code>anchorElem</code>, which is
        the <em>parent</em> of the editor root (obtained via{" "}
        <code>rootElement.parentElement</code>). This ensures the absolute
        position calculations are relative to the same offset parent as the
        table cells.
      </Callout>
    </>
  );
}
