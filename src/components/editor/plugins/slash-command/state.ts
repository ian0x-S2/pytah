import type { SlashCommand, SlashCommandSelection } from "./types";
import { getNeighborCommandId } from "./utils";

export interface SlashCommandState {
  isOpen: boolean;
  query: string;
  rawSelectedCommandId: SlashCommandSelection;
}

export type SlashCommandAction =
  | { type: "patch"; payload: Partial<SlashCommandState> }
  | {
      type: "open";
      payload: {
        firstCommandId: SlashCommandSelection;
        query: string;
      };
    }
  | {
      type: "move-selected-command";
      payload: {
        commands: readonly SlashCommand[];
        direction: "down" | "up";
      };
    };

export const createInitialSlashCommandState = (
  rawSelectedCommandId: SlashCommandSelection
): SlashCommandState => ({
  isOpen: false,
  query: "",
  rawSelectedCommandId,
});

const applySlashCommandPatch = (
  state: SlashCommandState,
  patch: Partial<SlashCommandState>
): SlashCommandState => {
  for (const key of Object.keys(patch) as (keyof SlashCommandState)[]) {
    if (state[key] !== patch[key]) {
      return { ...state, ...patch };
    }
  }

  return state;
};

export const slashCommandReducer = (
  state: SlashCommandState,
  action: SlashCommandAction
): SlashCommandState => {
  switch (action.type) {
    case "patch": {
      return applySlashCommandPatch(state, action.payload);
    }
    case "open": {
      // A fresh slash query always starts at the top of the list. The raw
      // selection survives the menu closing (execute, escape, selection
      // lost), so reopening without this reset would keep the highlight on
      // the previously chosen item.
      return applySlashCommandPatch(state, {
        isOpen: true,
        query: action.payload.query,
        rawSelectedCommandId: state.isOpen
          ? state.rawSelectedCommandId
          : action.payload.firstCommandId,
      });
    }
    case "move-selected-command": {
      return applySlashCommandPatch(state, {
        rawSelectedCommandId: getNeighborCommandId(
          action.payload.commands,
          state.rawSelectedCommandId,
          action.payload.direction
        ),
      });
    }
    default: {
      return state;
    }
  }
};
