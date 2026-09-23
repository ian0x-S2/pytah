"use client";

import { createCommand } from "lexical";
import type { LexicalCommand } from "lexical";

export const INSERT_EXCALIDRAW_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_EXCALIDRAW_COMMAND"
);
