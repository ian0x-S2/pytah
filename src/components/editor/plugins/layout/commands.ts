import type { NodeKey } from "lexical";
import { createCommand } from "lexical";

export interface InsertLayoutPayload {
  /**
   * When omitted or empty the plugin opens its own preset dialog instead of
   * applying a layout directly — the slash menu and toolbars dispatch the
   * bare command without owning any dialog UI.
   */
  targetNodeKey?: NodeKey;
  templateColumns?: string;
}

export const INSERT_LAYOUT_COMMAND = createCommand<InsertLayoutPayload>(
  "INSERT_LAYOUT_COMMAND"
);
