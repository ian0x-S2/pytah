import type { NodeKey } from "lexical";
import { createCommand } from "lexical";

export interface InsertImagePayload {
  altText: string;
  src: string;
  targetNodeKey?: NodeKey;
}

export const INSERT_IMAGE_COMMAND = createCommand<InsertImagePayload>(
  "INSERT_IMAGE_COMMAND"
);
