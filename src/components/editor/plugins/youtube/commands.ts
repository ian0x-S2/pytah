import { createCommand } from "lexical";

export interface InsertYouTubePayload {
  targetNodeKey?: string;
  videoId: string;
}

export const INSERT_YOUTUBE_COMMAND = createCommand<InsertYouTubePayload>(
  "INSERT_YOUTUBE_COMMAND"
);
