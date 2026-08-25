"use client";

import type { Transformer } from "@lexical/markdown";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { ComponentType } from "react";
import { FocusOnMountPlugin } from "../plugins/core/focus-on-mount";
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar/plugin";
import { FloatingLinkEditorPlugin } from "../plugins/link-behavior/floating-link-editor";
import { BUILTIN_MARKDOWN_TRANSFORMERS } from "../plugins/markdown/transformers";
import { CORE_SLASH_COMMANDS } from "../plugins/slash-command/commands";
import { CORE_SLASH_COMMAND_EXECUTORS } from "../plugins/slash-command/executors";
import { SlashCommandPlugin } from "../plugins/slash-command/plugin";
import type {
  FeatureSlashCommand,
  SlashCommand,
} from "../plugins/slash-command/types";
import { replaceCurrentBlock } from "../plugins/slash-command/utils";
import type { EditorFeatureFlags, ExtraEditorFeature } from "./types";

export type ComputedNode = NonNullable<InitialConfigType["nodes"]>[number];

export type LexicalNodeList = ComputedNode[];

/**
 * One descriptor of a built-in *core* capability — behavior the base editor
 * always ships and consumers can toggle at runtime through
 * `EditorFeatureFlags`. Content features (images, tables, drawings, ...) are
 * not listed here: they ship as separate registry items and are composed via
 * `extraFeatures`, so uninstalled features never reach the bundle.
 */
export interface EditorFeature {
  /** Only mount the plugin when the editor is editable. */
  editableOnly?: boolean;
  /** Whether the feature can be toggled by name inside `EditorFeatureFlags`. */
  flag: keyof EditorFeatureFlags & string;
  /** The behavior plugin to mount on the editor. */
  plugin?: ComponentType;
}

/**
 * The ordered list of built-in core features. Nodes, transformers and slash
 * commands for removable content features live beside their features
 * (`plugins/<feature>/feature.ts`) and are wired through `extraFeatures`.
 */
export const EDITOR_FEATURES: readonly EditorFeature[] = [
  {
    editableOnly: true,
    flag: "focusOnMount",
    plugin: FocusOnMountPlugin,
  },
  {
    editableOnly: true,
    flag: "floatingLinkEditor",
    plugin: FloatingLinkEditorPlugin,
  },
  {
    editableOnly: true,
    flag: "floatingToolbar",
    plugin: FloatingToolbarPlugin,
  },
];

/**
 * Collects node registrations contributed by installed extras. Core nodes
 * (headings, lists, links, code, base table) are registered statically in
 * `core/config.ts` and are not affected.
 */
export const computeFeatureNodes = (
  extraFeatures?: readonly ExtraEditorFeature[]
): LexicalNodeList => {
  const nodes: LexicalNodeList = [];

  for (const extra of extraFeatures ?? []) {
    if (extra.nodes) {
      nodes.push(...extra.nodes);
    }
  }

  return nodes;
};

/**
 * Core transformer set plus every transformer contributed by installed
 * extras — this is what markdown shortcuts, seeding and snapshot reads use.
 */
export const computeEditorTransformers = (
  extraFeatures?: readonly ExtraEditorFeature[]
): readonly Transformer[] => {
  const transformers: Transformer[] = [...BUILTIN_MARKDOWN_TRANSFORMERS];

  for (const extra of extraFeatures ?? []) {
    if (extra.transformers) {
      transformers.push(...extra.transformers);
    }
  }

  return transformers;
};

const buildCoreSlashCommandEntry = (
  command: SlashCommand
): FeatureSlashCommand => ({
  command,
  run: (editor) => {
    const executor = CORE_SLASH_COMMAND_EXECUTORS[command.id];
    if (!executor) {
      return;
    }
    replaceCurrentBlock(editor, executor);
  },
});

/**
 * Core block-type commands are always available; feature-scoped entries come
 * exclusively from installed extras. The shared insert menu renders exactly
 * this resolved list.
 */
export const computeResolvedSlashCommands = (
  extraFeatures?: readonly ExtraEditorFeature[]
): readonly FeatureSlashCommand[] => {
  const commands: FeatureSlashCommand[] = CORE_SLASH_COMMANDS.map(
    buildCoreSlashCommandEntry
  );

  for (const extra of extraFeatures ?? []) {
    if (extra.slashCommands) {
      commands.push(...extra.slashCommands);
    }
  }

  return commands;
};

/**
 * Mounted by the composition surface when the `slashCommand` flag is enabled.
 * Receives the fully resolved contribution list rather than raw ids.
 */
export const renderSlashCommandPlugin = (
  commands: readonly FeatureSlashCommand[]
) => {
  return <SlashCommandPlugin commands={commands} />;
};
