"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import type { ElementFormatType } from "lexical";
import { useEffect, useState } from "react";

import type { BlockTypeValue } from "../block-type-toolbar/types";
import {
  getBlockTypeFromSelection,
  getElementFormatFromSelection,
} from "../block-type-toolbar/utils";
import { DEFAULT_FORMAT_STATE } from "../floating-toolbar/constants";
import {
  areFloatingToolbarFormatsEqual,
  readInlineFormats,
} from "../floating-toolbar/selection";
import type { FloatingToolbarFormatState } from "../floating-toolbar/types";

export function useToolbarState() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<BlockTypeValue>("paragraph");
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [formats, setFormats] =
    useState<FloatingToolbarFormatState>(DEFAULT_FORMAT_STATE);

  useEffect(() => {
    let frameId: number | null = null;

    const update = () => {
      editor.getEditorState().read(() => {
        const nextBlockType = getBlockTypeFromSelection();
        const resolvedBlockType = nextBlockType ?? "paragraph";
        const nextElementFormat = getElementFormatFromSelection();

        setBlockType((currentBlockType) =>
          currentBlockType === resolvedBlockType
            ? currentBlockType
            : resolvedBlockType
        );
        setElementFormat((currentFormat) =>
          currentFormat === nextElementFormat
            ? currentFormat
            : nextElementFormat
        );

        const nextFormats = readInlineFormats();
        setFormats((currentFormats) =>
          areFloatingToolbarFormatsEqual(currentFormats, nextFormats)
            ? currentFormats
            : nextFormats
        );
      });
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        update();
      });
    };

    update();

    const unregister = mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          scheduleUpdate();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(() => {
        scheduleUpdate();
      })
    );

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      unregister();
    };
  }, [editor]);

  return { blockType, canRedo, canUndo, elementFormat, formats, setBlockType };
}
