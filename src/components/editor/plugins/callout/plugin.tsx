"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  INSERT_PARAGRAPH_COMMAND,
  KEY_BACKSPACE_COMMAND,
} from "lexical";
import { useEffect } from "react";

import { $isCalloutNode, CalloutNode } from "../../core/nodes/callout/node";
import { INSERT_CALLOUT_COMMAND } from "./commands";
import { insertCallout } from "./utils";

export function CalloutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CalloutNode])) {
      throw new Error(
        "CalloutPlugin: CalloutNode is not registered on the editor"
      );
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_CALLOUT_COMMAND,
        (payload) => {
          insertCallout(payload?.type, payload?.emoji, payload?.targetNodeKey);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const calloutNode = $findMatchingParent(anchorNode, $isCalloutNode);
          if (!$isCalloutNode(calloutNode)) {
            return false;
          }

          const topLevelBlock = anchorNode.getTopLevelElementOrThrow();
          // If the cursor is on an empty paragraph at the very end of the callout,
          // pressing Enter exits the callout and creates a new paragraph below it.
          if (
            topLevelBlock === calloutNode.getLastChild() &&
            topLevelBlock.getTextContent().length === 0 &&
            calloutNode.getChildrenSize() > 1
          ) {
            topLevelBlock.remove();
            const newParagraph = $createParagraphNode();
            calloutNode.insertAfter(newParagraph);
            newParagraph.select();
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        () => {
          const selection = $getSelection();
          if (
            !$isRangeSelection(selection) ||
            !selection.isCollapsed() ||
            selection.anchor.offset !== 0
          ) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const calloutNode = $findMatchingParent(anchorNode, $isCalloutNode);
          if (!$isCalloutNode(calloutNode)) {
            return false;
          }

          // If callout is completely empty or caret is at start of first empty paragraph,
          // unwrapping it to a regular paragraph
          if (calloutNode.getTextContent().trim().length === 0) {
            const paragraph = $createParagraphNode();
            calloutNode.replace(paragraph);
            paragraph.select();
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  return null;
}
