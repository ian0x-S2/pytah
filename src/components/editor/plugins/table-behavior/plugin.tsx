import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from "lexical";
import { Columns2Icon, MinusIcon, PlusIcon, Rows2Icon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  deleteSelectedTableColumn,
  deleteSelectedTableRow,
  insertTableColumn,
  insertTableRow,
} from "./actions";
import {
  EMPTY_TABLE_SELECTION_STATE,
  readTableSelectionState,
} from "./selection";
import type { TableOverlayPosition, TableSelectionState } from "./types";

const HORIZONTAL_CONTROL_GAP = 8;
const VERTICAL_CONTROL_GAP = 8;

const EMPTY_OVERLAY_POSITION: TableOverlayPosition = {
  height: 0,
  isVisible: false,
  left: 0,
  top: 0,
  width: 0,
};

export function TableBehaviorPlugin() {
  const [editor] = useLexicalComposerContext();
  const [selectionState, setSelectionState] = useState<TableSelectionState>(
    EMPTY_TABLE_SELECTION_STATE
  );
  const [overlayPosition, setOverlayPosition] = useState<TableOverlayPosition>(
    EMPTY_OVERLAY_POSITION
  );

  const updateSelectionState = useCallback(() => {
    editor.getEditorState().read(() => {
      setSelectionState(readTableSelectionState());
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateSelectionState();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(() => {
        updateSelectionState();
      })
    );
  }, [editor, updateSelectionState]);

  const updateOverlayPosition = useCallback(() => {
    const tableKey = selectionState.tableKey;

    if (!(selectionState.isActive && tableKey)) {
      setOverlayPosition(EMPTY_OVERLAY_POSITION);
      return;
    }

    const tableElement = editor.getElementByKey(tableKey);
    if (!tableElement) {
      setOverlayPosition(EMPTY_OVERLAY_POSITION);
      return;
    }

    const tableRect = tableElement.getBoundingClientRect();

    setOverlayPosition({
      height: tableRect.height,
      isVisible: true,
      left: tableRect.left,
      top: tableRect.top,
      width: tableRect.width,
    });
  }, [editor, selectionState.isActive, selectionState.tableKey]);

  useLayoutEffect(() => {
    updateOverlayPosition();
  }, [updateOverlayPosition]);

  useEffect(() => {
    if (!selectionState.isActive) {
      return;
    }

    const handleWindowChange = () => {
      updateOverlayPosition();
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [selectionState.isActive, updateOverlayPosition]);

  const canDeleteRow = selectionState.rowCount > 1;
  const canDeleteColumn = selectionState.columnCount > 1;

  const rowToolbarStyle = useMemo(() => {
    return {
      left: overlayPosition.left + overlayPosition.width / 2,
      top: overlayPosition.top - VERTICAL_CONTROL_GAP,
      transform: "translate(-50%, -100%)",
    };
  }, [overlayPosition.left, overlayPosition.top, overlayPosition.width]);

  const columnToolbarStyle = useMemo(() => {
    return {
      left: overlayPosition.left - HORIZONTAL_CONTROL_GAP,
      top: overlayPosition.top + overlayPosition.height / 2,
      transform: "translate(-100%, -50%)",
    };
  }, [overlayPosition.height, overlayPosition.left, overlayPosition.top]);

  const showOverlay = selectionState.isActive && overlayPosition.isVisible;

  if (!showOverlay) {
    return <TablePlugin hasCellBackgroundColor={false} hasHorizontalScroll />;
  }

  return (
    <>
      <TablePlugin hasCellBackgroundColor={false} hasHorizontalScroll />
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className="pointer-events-auto absolute flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-sm backdrop-blur-sm"
            style={rowToolbarStyle}
          >
            <Button
              aria-label="Insert row above"
              onClick={() => insertTableRow(editor, false)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <PlusIcon />
            </Button>
            <Button
              aria-label="Insert row below"
              onClick={() => insertTableRow(editor, true)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Rows2Icon />
            </Button>
            <Button
              aria-label="Delete current row"
              disabled={!canDeleteRow}
              onClick={() => deleteSelectedTableRow(editor)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <MinusIcon />
            </Button>
          </div>

          <div
            className="pointer-events-auto absolute flex flex-col items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-sm backdrop-blur-sm"
            style={columnToolbarStyle}
          >
            <Button
              aria-label="Insert column to the left"
              onClick={() => insertTableColumn(editor, false)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <PlusIcon />
            </Button>
            <Button
              aria-label="Insert column to the right"
              onClick={() => insertTableColumn(editor, true)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Columns2Icon />
            </Button>
            <Button
              aria-label="Delete current column"
              disabled={!canDeleteColumn}
              onClick={() => deleteSelectedTableColumn(editor)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <MinusIcon />
            </Button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
