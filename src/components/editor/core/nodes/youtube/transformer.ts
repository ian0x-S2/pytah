import type { ElementTransformer } from "@lexical/markdown";
import { parseYouTubeUrl } from "../../../plugins/youtube/utils";
import { $createYouTubeNode, $isYouTubeNode, YouTubeNode } from "./node";

const YOUTUBE_URL_REGEXP = /^https?:\/\/\S+$/;

export const YOUTUBE_MARKDOWN_TRANSFORMER: ElementTransformer = {
  dependencies: [YouTubeNode],
  export: (node) => {
    if (!$isYouTubeNode(node)) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${node.getVideoId()}`;
  },
  regExp: YOUTUBE_URL_REGEXP,
  replace: (parentNode, _children, match) => {
    const videoId = parseYouTubeUrl(match[0]);
    if (!videoId) {
      return;
    }

    parentNode.replace($createYouTubeNode(videoId));
  },
  type: "element",
};
