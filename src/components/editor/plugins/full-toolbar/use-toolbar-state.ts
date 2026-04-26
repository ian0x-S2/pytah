"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from "lexical";
import { useEffect, useState } from "react";
import type { BlockTypeValue } from "../block-type-toolbar/types";
import { getBlockTypeFromSelection } from "../block-type-toolbar/utils";
import { DEFAULT_FORMAT_STATE } from "../floating-toolbar/constants";
import {
  areFloatingToolbarFormatsEqual,
  readInlineFormats,
} from "../floating-toolbar/selection";
import type { FloatingToolbarFormatState } from "../floating-toolbar/types";

export function useToolbarState() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<BlockTypeValue>("paragraph");
  const [formats, setFormats] =
    useState<FloatingToolbarFormatState>(DEFAULT_FORMAT_STATE);

  useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const nextBlockType = getBlockTypeFromSelection();
        const resolvedBlockType = nextBlockType ?? "paragraph";

        setBlockType((currentBlockType) =>
          currentBlockType === resolvedBlockType
            ? currentBlockType
            : resolvedBlockType
        );

        const nextFormats = readInlineFormats();
        setFormats((currentFormats) =>
          areFloatingToolbarFormatsEqual(currentFormats, nextFormats)
            ? currentFormats
            : nextFormats
        );
      });
    };

    update();

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(() => {
        update();
      })
    );
  }, [editor]);

  return { blockType, formats, setBlockType };
}
