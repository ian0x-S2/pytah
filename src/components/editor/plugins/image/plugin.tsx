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
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { useEffect, useState } from "react";
import { $createImageNode, $isImageNode } from "../../core/nodes/image/node";
import type { InsertImagePayload } from "./commands";
import { INSERT_IMAGE_COMMAND } from "./commands";
import { InsertImageDialog } from "./insert-dialog";
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

const EMPTY_DIALOG_STATE = {
  altText: "",
  fileName: "",
  fileSrc: null as string | null,
  open: false,
  pendingTargetKey: null as string | null,
  url: "",
};

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();
  const [dialogState, setDialogState] = useState(EMPTY_DIALOG_STATE);

  useEffect(() => {
    const insertImage = ({
      alignment,
      altText,
      src,
      targetNodeKey,
    }: InsertImagePayload) => {
      const trimmedSrc = src?.trim();
      if (!trimmedSrc) {
        return false;
      }

      const imageNode = $createImageNode({
        alignment,
        altText: altText?.trim() ?? "",
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

  // Incomplete payloads (no src) mean "open the pick-a-source dialog". The
  // slash menu and toolbars dispatch the bare command; the target block is
  // captured here so the dialog submit replaces it.
  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        if (payload.src?.trim()) {
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

  const closeDialog = () => {
    setDialogState(EMPTY_DIALOG_STATE);
  };

  const handleSubmit = () => {
    if (!(dialogState.fileSrc || dialogState.url.trim())) {
      return;
    }

    editor.update(() => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: dialogState.altText,
        src: dialogState.fileSrc ?? dialogState.url.trim(),
        targetNodeKey: dialogState.pendingTargetKey ?? undefined,
      });
    });
    closeDialog();
  };

  return (
    <InsertImageDialog
      idPrefix="image-plugin"
      imageAltText={dialogState.altText}
      imageFileName={dialogState.fileName}
      imageFileSrc={dialogState.fileSrc}
      imageUrl={dialogState.url}
      onAltTextChange={(value) =>
        setDialogState((state) => ({ ...state, altText: value }))
      }
      onCancel={closeDialog}
      onImageFileChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) {
          return;
        }
        readFileAsDataUrl(file)
          .then((src) => {
            setDialogState((state) => ({
              ...state,
              fileName: file.name,
              fileSrc: src,
            }));
          })
          .catch(() => {
            setDialogState((state) => ({ ...state, fileSrc: null }));
          });
      }}
      onSubmit={handleSubmit}
      onUrlChange={(value) =>
        setDialogState((state) => ({ ...state, url: value }))
      }
      open={dialogState.open}
    />
  );
}
