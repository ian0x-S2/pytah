import { createCommand } from "lexical";

export interface InsertLayoutPayload {
  targetNodeKey?: string;
  templateColumns: string;
}

export const INSERT_LAYOUT_COMMAND = createCommand<InsertLayoutPayload>(
  "INSERT_LAYOUT_COMMAND"
);
