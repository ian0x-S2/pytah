"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
} from "lexical";
import { useEffect, useState } from "react";

import {
  $isLayoutContainerNode,
  LayoutContainerNode,
} from "../../core/nodes/layout/container-node";
import {
  $createLayoutItemNode,
  $isLayoutItemNode,
  LayoutItemNode,
} from "../../core/nodes/layout/item-node";
import { INSERT_LAYOUT_COMMAND } from "./commands";
import { LayoutPresetDialog } from "./preset-dialog";
import { applyLayoutPreset, insertLayoutPreset } from "./utils";

const EMPTY_DIALOG_STATE = {
  open: false,
  pendingTargetKey: null as string | null,
};

const shouldInsertParagraphBeforeLayout = (): LayoutContainerNode | null => {
  const selection = $getSelection();
  if (
    !(
      $isRangeSelection(selection) &&
      selection.isCollapsed() &&
      selection.anchor.offset === 0
    )
  ) {
    return null;
  }

  const container = $findMatchingParent(
    selection.anchor.getNode(),
    $isLayoutContainerNode
  );
  if (!$isLayoutContainerNode(container)) {
    return null;
  }

  const parent = container.getParent();
  if (
    parent &&
    parent.getFirstChild() === container &&
    selection.anchor.key === container.getFirstDescendant()?.getKey()
  ) {
    return container;
  }

  return null;
};

const shouldInsertParagraphAfterLayout = (): LayoutContainerNode | null => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) && selection.isCollapsed())) {
    return null;
  }

  const container = $findMatchingParent(
    selection.anchor.getNode(),
    $isLayoutContainerNode
  );
  if (!$isLayoutContainerNode(container)) {
    return null;
  }

  const parent = container.getParent();
  const lastDescendant = container.getLastDescendant();
  if (
    parent &&
    parent.getLastChild() === container &&
    lastDescendant &&
    selection.anchor.key === lastDescendant.getKey() &&
    selection.anchor.offset === lastDescendant.getTextContentSize()
  ) {
    return container;
  }

  return null;
};

export function LayoutPlugin() {
  const [editor] = useLexicalComposerContext();
  const [dialogState, setDialogState] = useState(EMPTY_DIALOG_STATE);

  useEffect(() => {
    if (!editor.hasNodes([LayoutContainerNode, LayoutItemNode])) {
      return;
    }

    const handleEscapeBefore = () => {
      const container = shouldInsertParagraphBeforeLayout();
      if (!container) {
        return false;
      }
      const paragraph = $createParagraphNode();
      container.insertBefore(paragraph);
      paragraph.select();
      return true;
    };

    const handleEscapeAfter = () => {
      const container = shouldInsertParagraphAfterLayout();
      if (!container) {
        return false;
      }
      const paragraph = $createParagraphNode();
      container.insertAfter(paragraph);
      paragraph.select();
      return true;
    };

    return mergeRegister(
      editor.registerNodeTransform(LayoutItemNode, (node) => {
        const parent = node.getParent();
        if (!$isLayoutContainerNode(parent)) {
          for (const child of node.getChildren()) {
            node.insertBefore(child);
          }
          node.remove();
          return;
        }
        if (node.getChildrenSize() === 0) {
          node.append($createParagraphNode());
        }
      }),
      editor.registerNodeTransform(LayoutContainerNode, (node) => {
        const children = node.getChildren();
        if (children.length === 0) {
          node.remove();
          return;
        }
        for (const child of children) {
          if (!$isLayoutItemNode(child)) {
            const item = $createLayoutItemNode();
            child.replace(item);
            if ($isElementNode(child) && !child.isInline()) {
              item.append(child);
            } else {
              const paragraph = $createParagraphNode();
              paragraph.append(child);
              item.append(paragraph);
            }
          }
        }
      }),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        handleEscapeBefore,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        handleEscapeBefore,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        handleEscapeAfter,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        handleEscapeAfter,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
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
          if ($isRangeSelection(selection)) {
            const targetElement = selection.anchor
              .getNode()
              .getTopLevelElement();
            if (
              targetElement &&
              $isParagraphNode(targetElement) &&
              targetElement.getTextContent().trim().length === 0
            ) {
              applyLayoutPreset(targetElement, templateColumns);
              return true;
            }
          }

          insertLayoutPreset(templateColumns);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      // Incomplete payloads (no template) mean "open the preset picker".
      editor.registerCommand(
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
              const topLevel = node.getTopLevelElement();
              if (
                topLevel &&
                $isParagraphNode(topLevel) &&
                topLevel.getTextContent().trim().length === 0
              ) {
                targetNodeKey = topLevel.getKey();
              } else if (
                $isTextNode(node) &&
                node.getTextContent().trim().startsWith("/")
              ) {
                targetNodeKey = topLevel?.getKey() ?? null;
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
      )
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
