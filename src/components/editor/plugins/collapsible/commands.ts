import { createCommand } from "lexical";

export interface InsertCollapsiblePayload {
  targetNodeKey?: string;
}

export const INSERT_COLLAPSIBLE_COMMAND = createCommand<
  InsertCollapsiblePayload | undefined
>("INSERT_COLLAPSIBLE_COMMAND");
