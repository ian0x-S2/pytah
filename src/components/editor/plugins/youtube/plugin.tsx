"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { useEffect, useState } from "react";
import { $createYouTubeNode, YouTubeNode } from "../../core/nodes/youtube/node";
import { INSERT_YOUTUBE_COMMAND } from "./commands";
import { InsertYouTubeDialog } from "./insert-dialog";

const insertParagraphAfterYouTube = (
  youTubeNode: ReturnType<typeof $createYouTubeNode>
) => {
  const paragraph = $createParagraphNode();
  youTubeNode.insertAfter(paragraph);
  paragraph.select();
};

const EMPTY_DIALOG_STATE = {
  open: false,
  pendingTargetKey: null as string | null,
  url: "",
};

export function YouTubePlugin() {
  const [editor] = useLexicalComposerContext();
  const [dialogState, setDialogState] = useState(EMPTY_DIALOG_STATE);

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }

    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      ({ targetNodeKey, videoId }) => {
        const trimmedVideoId = videoId?.trim();
        if (!trimmedVideoId) {
          return false;
        }

        const youTubeNode = $createYouTubeNode(trimmedVideoId);

        if (targetNodeKey) {
          const targetNode = $getNodeByKey(targetNodeKey);
          if (!$isElementNode(targetNode)) {
            return false;
          }

          targetNode.replace(youTubeNode);
          insertParagraphAfterYouTube(youTubeNode);
          return true;
        }

        $insertNodeToNearestRoot(youTubeNode);
        insertParagraphAfterYouTube(youTubeNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  // Incomplete payloads (no video id) mean "open the embed dialog".
  useEffect(() => {
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        if (payload.videoId?.trim()) {
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

  const closeDialog = () => {
    setDialogState(EMPTY_DIALOG_STATE);
  };

  const handleSubmit = () => {
    editor.update(() => {
      editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, {
        targetNodeKey: dialogState.pendingTargetKey ?? undefined,
        videoId: dialogState.url,
      });
    });
    closeDialog();
  };

  return (
    <InsertYouTubeDialog
      idPrefix="youtube-plugin"
      onCancel={closeDialog}
      onSubmit={handleSubmit}
      onUrlChange={(value) =>
        setDialogState((state) => ({ ...state, url: value }))
      }
      open={dialogState.open}
      youTubeUrl={dialogState.url}
    />
  );
}
