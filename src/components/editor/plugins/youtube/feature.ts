import { PlayIcon } from "lucide-react";
import { YouTubeNode } from "../../core/nodes/youtube/node";
import { YOUTUBE_MARKDOWN_TRANSFORMER } from "../../core/nodes/youtube/transformer";
import type { ExtraEditorFeature } from "../../core/types";
import { INSERT_YOUTUBE_COMMAND } from "./commands";
import { YouTubePlugin } from "./plugin";

/**
 * Installs the YouTube feature: the `YouTubeNode`, the URL markdown
 * transformer and the shared insert-menu entry. Ships as the `editor-youtube`
 * registry item.
 */
export const youtubeFeature: ExtraEditorFeature = {
  id: "youtube",
  nodes: [YouTubeNode],
  plugin: YouTubePlugin,
  slashCommands: [
    {
      command: {
        description: "Embed a YouTube video",
        icon: PlayIcon,
        id: "youtube",
        keywords: ["youtube", "video", "embed", "yt"],
        label: "YouTube",
      },
      run: (editor) => {
        editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, {});
      },
    },
  ],
  transformers: [YOUTUBE_MARKDOWN_TRANSFORMER],
};
