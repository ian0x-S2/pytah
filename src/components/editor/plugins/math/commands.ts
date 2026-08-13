import { createCommand, type LexicalCommand } from "lexical";
import type { MathPayload } from "../../core/nodes/math/node";

export const INSERT_MATH_COMMAND: LexicalCommand<MathPayload> = createCommand(
  "INSERT_MATH_COMMAND"
);
