import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";
import { INSERT_LAYOUT_COMMAND } from "./commands";
import { applyLayoutPreset } from "./utils";

export function LayoutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_LAYOUT_COMMAND,
      ({ targetNodeKey, templateColumns }) => {
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

  return null;
}
