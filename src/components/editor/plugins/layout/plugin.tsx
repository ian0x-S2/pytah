"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { useEffect, useState } from "react";
import { INSERT_LAYOUT_COMMAND } from "./commands";
import { LayoutPresetDialog } from "./preset-dialog";
import { applyLayoutPreset } from "./utils";

const EMPTY_DIALOG_STATE = {
  open: false,
  pendingTargetKey: null as string | null,
};

export function LayoutPlugin() {
  const [editor] = useLexicalComposerContext();
  const [dialogState, setDialogState] = useState(EMPTY_DIALOG_STATE);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_LAYOUT_COMMAND,
      ({ targetNodeKey, templateColumns }) => {
        if (!templateColumns) {
          return false;
        }

        if (targetNodeKey) {
          const targetNode = $getNodeByKey(targetNodeKey);
          if (!$isElementNode(targetNode)) {
            return false;
          }

          applyLayoutPreset(targetNode, templateColumns);
          return true;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const targetElement = selection.anchor
          .getNode()
          .getTopLevelElementOrThrow();
        applyLayoutPreset(targetElement, templateColumns);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  // Incomplete payloads (no template) mean "open the preset picker".
  useEffect(() => {
    return editor.registerCommand(
      INSERT_LAYOUT_COMMAND,
      (payload) => {
        if (payload.templateColumns) {
          return false;
        }

        let targetNodeKey: string | null = payload.targetNodeKey ?? null;

        if (!targetNodeKey) {
          editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              return;
            }
            const node = selection.anchor.getNode();
            if ($isTextNode(node)) {
              targetNodeKey = node.getTopLevelElementOrThrow().getKey();
            }
          });
        }

        setDialogState({
          ...EMPTY_DIALOG_STATE,
          open: true,
          pendingTargetKey: targetNodeKey,
        });
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  const closeDialog = () => {
    setDialogState(EMPTY_DIALOG_STATE);
  };

  const handleSelectPreset = (templateColumns: string) => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, {
      targetNodeKey: dialogState.pendingTargetKey ?? undefined,
      templateColumns,
    });
    closeDialog();
  };

  return (
    <LayoutPresetDialog
      onCancel={closeDialog}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
      onSelectPreset={handleSelectPreset}
      open={dialogState.open}
    />
  );
}
