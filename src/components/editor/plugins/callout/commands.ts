import { createCommand } from "lexical";

import type { CalloutType } from "../../core/nodes/callout/node";

export interface InsertCalloutPayload {
  emoji?: string;
  targetNodeKey?: string;
  type?: CalloutType;
}

export const INSERT_CALLOUT_COMMAND = createCommand<
  InsertCalloutPayload | undefined
>("INSERT_CALLOUT_COMMAND");
