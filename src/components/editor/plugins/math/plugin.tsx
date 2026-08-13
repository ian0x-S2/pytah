"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";
import { $createMathNode, type MathPayload } from "../../core/nodes/math/node";
import { INSERT_MATH_COMMAND } from "./commands";

export function MathPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MathPayload>(
        INSERT_MATH_COMMAND,
        (payload) => {
          const { equation, inline = true } = payload;
          const mathNode = $createMathNode({ equation, inline });

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            if (inline) {
              $insertNodes([mathNode]);
            } else {
              $insertNodeToNearestRoot(mathNode);
            }
          } else {
            $insertNodes([mathNode]);
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}
