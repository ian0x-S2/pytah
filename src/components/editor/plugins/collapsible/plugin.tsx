"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
} from "lexical";
import { useEffect } from "react";
import {
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from "../../core/nodes/collapsible/container-node";
import {
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from "../../core/nodes/collapsible/content-node";
import {
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
} from "../../core/nodes/collapsible/title-node";
import {
  INSERT_COLLAPSIBLE_COMMAND,
  type InsertCollapsiblePayload,
} from "./commands";
import { insertCollapsible } from "./utils";

const shouldInsertParagraphBeforeCollapsible = () => {
  const selection = $getSelection();
  if (
    !(
      $isRangeSelection(selection) &&
      selection.isCollapsed() &&
      selection.anchor.offset === 0
    )
  ) {
    return false;
  }

  const container = $findMatchingParent(
    selection.anchor.getNode(),
    $isCollapsibleContainerNode
  );
  if (!$isCollapsibleContainerNode(container)) {
    return false;
  }

  const parent = container.getParent();
  return !!(
    parent &&
    parent.getFirstChild() === container &&
    selection.anchor.key === container.getFirstDescendant()?.getKey()
  );
};

const shouldInsertParagraphAfterCollapsible = () => {
  const selection = $getSelection();
  if (!($isRangeSelection(selection) && selection.isCollapsed())) {
    return false;
  }

  const container = $findMatchingParent(
    selection.anchor.getNode(),
    $isCollapsibleContainerNode
  );
  if (!$isCollapsibleContainerNode(container)) {
    return false;
  }

  const parent = container.getParent();
  if (!(parent && parent.getLastChild() === container)) {
    return false;
  }

  const titleParagraph = container.getFirstDescendant();
  const contentParagraph = container.getLastDescendant();

  return !!(
    (contentParagraph &&
      selection.anchor.key === contentParagraph.getKey() &&
      selection.anchor.offset === contentParagraph.getTextContentSize()) ||
    (titleParagraph &&
      selection.anchor.key === titleParagraph.getKey() &&
      selection.anchor.offset === titleParagraph.getTextContentSize())
  );
};

export function CollapsiblePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (
      !editor.hasNodes([
        CollapsibleContainerNode,
        CollapsibleTitleNode,
        CollapsibleContentNode,
      ])
    ) {
      throw new Error(
        "CollapsiblePlugin requires collapsible nodes to be registered"
      );
    }

    return mergeRegister(
      editor.registerNodeTransform(CollapsibleContentNode, (node) => {
        const parent = node.getParent();
        if ($isCollapsibleContainerNode(parent)) {
          return;
        }

        for (const child of node.getChildren()) {
          node.insertBefore(child);
        }
        node.remove();
      }),
      editor.registerNodeTransform(CollapsibleTitleNode, (node) => {
        const parent = node.getParent();
        if ($isCollapsibleContainerNode(parent)) {
          return;
        }

        node.replace($createParagraphNode().append(...node.getChildren()));
      }),
      editor.registerNodeTransform(CollapsibleContainerNode, (node) => {
        const children = node.getChildren();
        if (
          children.length === 2 &&
          $isCollapsibleTitleNode(children[0]) &&
          $isCollapsibleContentNode(children[1])
        ) {
          return;
        }

        for (const child of children) {
          node.insertBefore(child);
        }
        node.remove();
      }),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => {
          if (!shouldInsertParagraphBeforeCollapsible()) {
            return false;
          }

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const container = $findMatchingParent(
            selection.anchor.getNode(),
            $isCollapsibleContainerNode
          );
          if (!$isCollapsibleContainerNode(container)) {
            return false;
          }

          container.insertBefore($createParagraphNode());
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        () => {
          if (!shouldInsertParagraphBeforeCollapsible()) {
            return false;
          }

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const container = $findMatchingParent(
            selection.anchor.getNode(),
            $isCollapsibleContainerNode
          );
          if (!$isCollapsibleContainerNode(container)) {
            return false;
          }

          container.insertBefore($createParagraphNode());
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => {
          if (!shouldInsertParagraphAfterCollapsible()) {
            return false;
          }

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const container = $findMatchingParent(
            selection.anchor.getNode(),
            $isCollapsibleContainerNode
          );
          if (!$isCollapsibleContainerNode(container)) {
            return false;
          }

          container.insertAfter($createParagraphNode());
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        () => {
          if (!shouldInsertParagraphAfterCollapsible()) {
            return false;
          }

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const container = $findMatchingParent(
            selection.anchor.getNode(),
            $isCollapsibleContainerNode
          );
          if (!$isCollapsibleContainerNode(container)) {
            return false;
          }

          container.insertAfter($createParagraphNode());
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const titleNode = $findMatchingParent(
            selection.anchor.getNode(),
            $isCollapsibleTitleNode
          );
          if (!$isCollapsibleTitleNode(titleNode)) {
            return false;
          }

          const container = titleNode.getParent();
          if (!$isCollapsibleContainerNode(container)) {
            return false;
          }

          if (!container.getOpen()) {
            container.toggleOpen();
          }

          titleNode.getNextSibling()?.selectEnd();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        (payload?: InsertCollapsiblePayload) => {
          return insertCollapsible(payload?.targetNodeKey);
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  return null;
}
