"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";
import { $createYouTubeNode, YouTubeNode } from "../../core/nodes/youtube/node";
import { INSERT_YOUTUBE_COMMAND } from "./commands";

const insertParagraphAfterYouTube = (
  youTubeNode: ReturnType<typeof $createYouTubeNode>
) => {
  const paragraph = $createParagraphNode();
  youTubeNode.insertAfter(paragraph);
  paragraph.select();
};

export function YouTubePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }

    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      ({ targetNodeKey, videoId }) => {
        const trimmedVideoId = videoId.trim();
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

  return null;
}
