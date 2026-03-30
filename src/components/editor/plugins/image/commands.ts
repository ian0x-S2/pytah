import type { NodeKey } from "lexical";
import { createCommand } from "lexical";
import type { ImageAlignment } from "../../core/nodes/image-node";

export interface InsertImagePayload {
  alignment?: ImageAlignment;
  altText: string;
  src: string;
  targetNodeKey?: NodeKey;
}

export const INSERT_IMAGE_COMMAND = createCommand<InsertImagePayload>(
  "INSERT_IMAGE_COMMAND"
);
