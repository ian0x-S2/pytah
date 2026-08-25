import type { NodeKey } from "lexical";
import { createCommand } from "lexical";
import type { ImageAlignment } from "../../core/nodes/image/node";

export interface InsertImagePayload {
  alignment?: ImageAlignment;
  altText?: string;
  /**
   * When omitted or empty the plugin opens its own insert dialog instead of
   * inserting directly — this is how the slash menu and toolbar trigger the
   * pick-a-source flow without owning any dialog UI themselves.
   */
  src?: string;
  targetNodeKey?: NodeKey;
}

export const INSERT_IMAGE_COMMAND = createCommand<InsertImagePayload>(
  "INSERT_IMAGE_COMMAND"
);
