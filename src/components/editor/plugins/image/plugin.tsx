"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE, eventFiles } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $createImageNode, $isImageNode } from "../../core/nodes/image/node";
import { INSERT_IMAGE_COMMAND } from "./commands";
import { getFirstImageFile, readFileAsDataUrl } from "./utils";

const insertParagraphAfterImage = (
  imageNode: ReturnType<typeof $createImageNode>
) => {
  if (!$isImageNode(imageNode)) {
    return;
  }

  const paragraph = $createParagraphNode();
  imageNode.insertAfter(paragraph);
  paragraph.select();
};

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const insertImage = ({
      alignment,
      altText,
      src,
      targetNodeKey,
    }: {
      alignment?: "left" | "center" | "right";
      altText: string;
      src: string;
      targetNodeKey?: string;
    }) => {
      const trimmedSrc = src.trim();
      if (!trimmedSrc) {
        return false;
      }

      const imageNode = $createImageNode({
        alignment,
        altText: altText.trim(),
        src: trimmedSrc,
      });

      if (targetNodeKey) {
        const targetNode = $getNodeByKey(targetNodeKey);
        if (!$isElementNode(targetNode)) {
          return false;
        }

        targetNode.replace(imageNode);
        insertParagraphAfterImage(imageNode);
        return true;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      $insertNodes([imageNode]);
      insertParagraphAfterImage(imageNode);
      return true;
    };

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => insertImage(payload),
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  useEffect(() => {
    const insertImageFile = async (file: File) => {
      const src = await readFileAsDataUrl(file);

      editor.update(() => {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          altText: file.name,
          src,
        });
      });
    };

    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        const imageFile = getFirstImageFile(files);
        if (!imageFile) {
          return false;
        }

        insertImageFile(imageFile).catch(() => undefined);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const [, files] = eventFiles(event);
        const imageFile = getFirstImageFile(files);
        if (!imageFile) {
          return false;
        }

        event.preventDefault();
        editor.dispatchCommand(DRAG_DROP_PASTE, [imageFile]);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        const [, files] = eventFiles(event);
        const imageFile = getFirstImageFile(files);
        if (!imageFile) {
          return false;
        }

        event.preventDefault();
        editor.dispatchCommand(DRAG_DROP_PASTE, [imageFile]);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
