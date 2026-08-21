"use client";

import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/extension";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $insertNodeToNearestRoot,
  addClassNamesToElement,
  mergeRegister,
  removeClassNamesFromElement,
} from "@lexical/utils";
import {
  $createNodeSelection,
  $getNodeFromDOMNode,
  $getSelection,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  type LexicalNode,
} from "lexical";
import { useEffect } from "react";
import { $replaceWithHorizontalRule } from "../markdown/transformers";

const toggleNodeSelection = (node: LexicalNode, shiftKey = false) => {
  const selection = $getSelection();
  const wasSelected = node.isSelected();
  const key = node.getKey();
  const nodeSelection =
    shiftKey && $isNodeSelection(selection)
      ? selection
      : $createNodeSelection();

  if (!($isNodeSelection(selection) && shiftKey)) {
    $setSelection(nodeSelection);
  }

  if (wasSelected) {
    nodeSelection.delete(key);
    return;
  }

  nodeSelection.add(key);
};

const getClickedHorizontalRuleNode = (target: EventTarget | null) => {
  if (!(target instanceof Node)) {
    return null;
  }

  const node = $getNodeFromDOMNode(target);
  return $isHorizontalRuleNode(node) ? node : null;
};

const syncHorizontalRuleSelectionClass = (
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  nodeKey: string,
  selectedClassName: string
) => {
  const element = editor.getElementByKey(nodeKey);
  if (!element) {
    return;
  }

  const node = $getNodeFromDOMNode(element);
  if (!$isHorizontalRuleNode(node)) {
    return;
  }

  if (node.isSelected()) {
    addClassNamesToElement(element, selectedClassName);
    return;
  }

  removeClassNamesFromElement(element, selectedClassName);
};

const registerHorizontalRuleInsertCommand = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
) => {
  return editor.registerCommand(
    INSERT_HORIZONTAL_RULE_COMMAND,
    () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      $insertNodeToNearestRoot($createHorizontalRuleNode());
      return true;
    },
    COMMAND_PRIORITY_EDITOR
  );
};

const registerHorizontalRuleClickCommand = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
) => {
  return editor.registerCommand(
    CLICK_COMMAND,
    (event) => {
      const node = getClickedHorizontalRuleNode(event.target);
      if (!node) {
        return false;
      }

      toggleNodeSelection(node, event.shiftKey);
      return true;
    },
    COMMAND_PRIORITY_LOW
  );
};

const registerHorizontalRuleEnterShortcut = (
  editor: ReturnType<typeof useLexicalComposerContext>[0]
) => {
  return editor.registerCommand(
    KEY_ENTER_COMMAND,
    (event) => {
      if (event?.shiftKey) {
        return false;
      }

      const selection = $getSelection();
      if (!($isRangeSelection(selection) && selection.isCollapsed())) {
        return false;
      }

      const anchorNode = selection.anchor.getNode();
      if (!$isTextNode(anchorNode)) {
        return false;
      }

      const parentNode = anchorNode.getParent();
      if (
        parentNode === null ||
        !$isParagraphNode(parentNode) ||
        !$isRootOrShadowRoot(parentNode.getParent()) ||
        parentNode.getChildrenSize() !== 1 ||
        parentNode.getFirstChild() !== anchorNode ||
        parentNode.getTextContent() !== "---" ||
        selection.anchor.offset !== anchorNode.getTextContent().length
      ) {
        return false;
      }

      $replaceWithHorizontalRule(parentNode, true);
      if (event !== null) {
        event.preventDefault();
      }
      return true;
    },
    COMMAND_PRIORITY_LOW
  );
};

const registerHorizontalRuleMutationListener = (
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  selectedClassName: string
) => {
  return editor.registerMutationListener(HorizontalRuleNode, (nodes) => {
    editor.read(() => {
      for (const [nodeKey, mutation] of nodes) {
        if (mutation === "destroyed") {
          continue;
        }

        syncHorizontalRuleSelectionClass(editor, nodeKey, selectedClassName);
      }
    });
  });
};

export function HorizontalRulePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const hrSelectedClassName = editor._config.theme.hrSelected ?? "selected";

    return mergeRegister(
      registerHorizontalRuleInsertCommand(editor),
      registerHorizontalRuleClickCommand(editor),
      registerHorizontalRuleEnterShortcut(editor),
      registerHorizontalRuleMutationListener(editor, hrSelectedClassName)
    );
  }, [editor]);

  return null;
}
