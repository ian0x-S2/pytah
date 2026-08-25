import type { NodeKey } from "lexical";
import { createCommand } from "lexical";

export interface InsertYouTubePayload {
  /**
   * When omitted or empty the plugin opens its own insert dialog instead of
   * inserting directly — the slash menu and toolbars dispatch the bare
   * command without owning any dialog UI.
   */
  targetNodeKey?: NodeKey;
  videoId?: string;
}

export const INSERT_YOUTUBE_COMMAND = createCommand<InsertYouTubePayload>(
  "INSERT_YOUTUBE_COMMAND"
);
