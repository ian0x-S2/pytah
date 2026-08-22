import type { SlashCommandId } from "../slash-command/types";

/**
 * Block types available in toolbar dropdowns mirror the slash command ids so
 * both surfaces stay in sync by construction.
 */
export type BlockTypeValue = SlashCommandId;

export interface BlockOption {
  alwaysOn?: boolean;
  description: string;
  label: string;
  value: BlockTypeValue;
}
