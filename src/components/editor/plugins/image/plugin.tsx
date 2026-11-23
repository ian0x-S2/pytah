"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE, eventFiles } from "@lexical/rich-text";
import { $insertNodeToNearestRoot } from "@lexical/utils";
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
  DROP_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { useEffect, useState } from "react";

import { $createImageNode, $isImageNode } from "../../core/nodes/image/node";
import { sanitizeMediaUrl } from "../../core/url";
import type { InsertImagePayload } from "./commands";
import { INSERT_IMAGE_COMMAND } from "./commands";
import { InsertImageDialog } from "./insert-dialog";
import {
  getImageFiles,
  isImageFile,
  MAX_IMAGE_FILE_SIZE_BYTES,
  readFileAsDataUrl,
} from "./utils";

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
  fileError: "",
  fileName: "",
  fileSrc: null as string | null,
  open: false,
  pendingTargetKey: null as string | null,
  url: "",
};

const MAX_IMAGE_FILE_SIZE_MB = Math.round(
  MAX_IMAGE_FILE_SIZE_BYTES / (1024 * 1024)
);

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
      const safeSrc = src
        ? sanitizeMediaUrl(src, { allowDataImage: true, allowRelative: true })
        : null;
      if (!safeSrc) {
        return false;
      }

      const imageNode = $createImageNode({
        alignment,
        altText: altText?.trim() ?? "",
        src: safeSrc,
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

      $insertNodeToNearestRoot(imageNode);
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
  // slash menu and toolbars dispatch the bare command; only an empty paragraph
  // (or an active slash query) is captured for replacement so toolbar inserts
  // never overwrite existing text.
  useEffect(
    () =>
      editor.registerCommand(
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
      ),
    [editor]
  );

  useEffect(() => {
    const insertImageFiles = async (files: File[]) => {
      const results = await Promise.allSettled(
        files.map(async (file) => ({
          altText: file.name,
          src: await readFileAsDataUrl(file),
        }))
      );

      for (const result of results) {
        if (result.status !== "fulfilled") {
          continue;
        }
        const { altText, src } = result.value;
        editor.update(() => {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            altText,
            src,
          });
        });
      }
    };

    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        const imageFiles = getImageFiles(files);
        if (imageFiles.length === 0) {
          return false;
        }

        void insertImageFiles(imageFiles);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(
    () =>
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          const [, files] = eventFiles(event);
          const imageFiles = getImageFiles(files);
          if (imageFiles.length === 0) {
            return false;
          }

          event.preventDefault();
          editor.dispatchCommand(DRAG_DROP_PASTE, imageFiles);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
    [editor]
  );

  useEffect(
    () =>
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          const [, files] = eventFiles(event);
          const imageFiles = getImageFiles(files);
          if (imageFiles.length === 0) {
            return false;
          }

          event.preventDefault();
          editor.dispatchCommand(DRAG_DROP_PASTE, imageFiles);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
    [editor]
  );

  const closeDialog = () => {
    setDialogState(EMPTY_DIALOG_STATE);
  };

  const handleSubmit = () => {
    const candidateSrc = dialogState.fileSrc ?? dialogState.url.trim();
    const safeSrc = candidateSrc
      ? sanitizeMediaUrl(candidateSrc, {
          allowDataImage: true,
          allowRelative: true,
        })
      : null;
    if (!safeSrc) {
      setDialogState((state) => ({
        ...state,
        fileError: "Enter a valid http(s) image URL or supported image file.",
      }));
      return;
    }

    editor.update(() => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        altText: dialogState.altText,
        src: safeSrc,
        targetNodeKey: dialogState.pendingTargetKey ?? undefined,
      });
    });
    closeDialog();
  };

  return (
    <InsertImageDialog
      idPrefix="image-plugin"
      imageAltText={dialogState.altText}
      imageFileError={dialogState.fileError}
      imageFileName={dialogState.fileName}
      imageFileSrc={dialogState.fileSrc}
      imageUrl={dialogState.url}
      onAltTextChange={(value) =>
        setDialogState((state) => ({ ...state, altText: value }))
      }
      onCancel={closeDialog}
      onClearFile={() =>
        setDialogState((state) => ({
          ...state,
          fileError: "",
          fileName: "",
          fileSrc: null,
        }))
      }
      onImageFileChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          return;
        }
        if (!isImageFile(file)) {
          setDialogState((state) => ({
            ...state,
            fileError: `Unsupported file. Use PNG, JPEG, WebP, GIF, or AVIF up to ${MAX_IMAGE_FILE_SIZE_MB} MB.`,
            fileName: "",
            fileSrc: null,
          }));
          return;
        }
        try {
          const src = await readFileAsDataUrl(file);
          setDialogState((state) => ({
            ...state,
            fileError: "",
            fileName: file.name,
            fileSrc: src,
          }));
        } catch {
          setDialogState((state) => ({
            ...state,
            fileError: "Failed to read image file.",
            fileName: "",
            fileSrc: null,
          }));
        }
      }}
      onSubmit={handleSubmit}
      onUrlChange={(value) =>
        setDialogState((state) => ({
          ...state,
          fileError: "",
          fileName: "",
          fileSrc: null,
          url: value,
        }))
      }
      open={dialogState.open}
    />
  );
}
