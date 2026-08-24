"use client";

import type { Transformer } from "@lexical/markdown";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { ComponentType } from "react";
import { CollapsiblePlugin } from "../plugins/collapsible/plugin";
import { FocusOnMountPlugin } from "../plugins/core/focus-on-mount";
import { SeedContentPlugin } from "../plugins/core/seed-content";
import { DraggableBlockPlugin } from "../plugins/draggable-block/plugin";
import { ExcalidrawPlugin } from "../plugins/excalidraw/plugin";
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar/plugin";
import { ImagePlugin } from "../plugins/image/plugin";
import { LayoutPlugin } from "../plugins/layout/plugin";
import { FloatingLinkEditorPlugin } from "../plugins/link-behavior/floating-link-editor";
import {
  BUILTIN_MARKDOWN_TRANSFORMERS,
  IMAGE_MARKDOWN_TRANSFORMER,
  MATH_BLOCK_MARKDOWN_TRANSFORMER,
  MATH_INLINE_MARKDOWN_TRANSFORMER,
  TABLE_MARKDOWN_TRANSFORMER,
  YOUTUBE_MARKDOWN_TRANSFORMER,
} from "../plugins/markdown/transformers";
import { MathPlugin } from "../plugins/math/plugin";
import { SlashCommandPlugin } from "../plugins/slash-command/plugin";
import type { SlashCommandId } from "../plugins/slash-command/types";
import { TableBehaviorPlugin } from "../plugins/table-behavior/plugin";
import { YouTubePlugin } from "../plugins/youtube/plugin";
import { CollapsibleContainerNode } from "./nodes/collapsible/container-node";
import { CollapsibleContentNode } from "./nodes/collapsible/content-node";
import { CollapsibleTitleNode } from "./nodes/collapsible/title-node";
import { ExcalidrawNode } from "./nodes/excalidraw/node";
import { ImageNode } from "./nodes/image/node";
import { LayoutContainerNode } from "./nodes/layout/container-node";
import { LayoutItemNode } from "./nodes/layout/item-node";
import { MathNode } from "./nodes/math/node";
import { YouTubeNode } from "./nodes/youtube/node";
import type { EditorFeatureFlags, ExtraEditorFeature } from "./types";

type ComputedNode = NonNullable<InitialConfigType["nodes"]>[number];

export type LexicalNodeList = ComputedNode[];

/**
 * One descriptor of a built-in editor capability. A feature bundles
 * everything a single opt-in/opt-out unit needs: the Lexical nodes it owns,
 * the behavior plugin it mounts, optional markdown transformers, and the
 * slash-command ids it contributes.
 *
 * Keeping each capability in one descriptor is what makes the default editor
 * a list of lego pieces: toggling a flag toggles the whole slice, and a new
 * feature contributes every wiring a consumer needs in one place.
 */
export interface EditorFeature {
  /** Only mount the plugin when the editor is editable. */
  editableOnly?: boolean;
  /** Whether the feature can be toggled by name inside `EditorFeatureFlags`. */
  flag: keyof EditorFeatureFlags & string;
  /** The Lexical nodes the feature owns; appended when enabled. */
  nodes?: LexicalNodeList;
  /** The behavior plugin to mount on the editor. */
  plugin?: ComponentType;
  /** The slash-command ids this feature adds to the shared insert menu. */
  slashCommandIds?: readonly SlashCommandId[];
  /** Markdown transformers contributed by the feature. */
  transformers?: readonly Transformer[];
}

/**
 * The ordered list of built-in editor features. This is the single source of
 * truth for what the default `Editor` ships: nodes, plugins, transformers and
 * slash commands all derive from here. The resolved set drives both the
 * configuration (nodes) and the mounted plugin stack (via `ui/content.tsx`).
 */
export const EDITOR_FEATURES: readonly EditorFeature[] = [
  {
    flag: "images",
    nodes: [ImageNode],
    plugin: ImagePlugin,
    transformers: [IMAGE_MARKDOWN_TRANSFORMER],
    slashCommandIds: ["image"],
  },
  {
    flag: "youtube",
    nodes: [YouTubeNode],
    plugin: YouTubePlugin,
    transformers: [YOUTUBE_MARKDOWN_TRANSFORMER],
    slashCommandIds: ["youtube"],
  },
  {
    flag: "excalidraw",
    nodes: [ExcalidrawNode],
    plugin: ExcalidrawPlugin,
    slashCommandIds: ["excalidraw"],
  },
  {
    flag: "math",
    nodes: [MathNode],
    plugin: MathPlugin,
    transformers: [
      MATH_INLINE_MARKDOWN_TRANSFORMER,
      MATH_BLOCK_MARKDOWN_TRANSFORMER,
    ],
    slashCommandIds: ["math"],
  },
  {
    flag: "collapsible",
    nodes: [
      CollapsibleContainerNode,
      CollapsibleTitleNode,
      CollapsibleContentNode,
    ],
    plugin: CollapsiblePlugin,
    slashCommandIds: ["collapsible"],
  },
  {
    flag: "layouts",
    nodes: [LayoutContainerNode, LayoutItemNode],
    plugin: LayoutPlugin,
    slashCommandIds: ["columns"],
  },
  {
    flag: "tables",
    plugin: TableBehaviorPlugin,
    transformers: [TABLE_MARKDOWN_TRANSFORMER],
    slashCommandIds: ["table"],
  },
  {
    flag: "seedContent",
  },
  {
    flag: "focusOnMount",
    plugin: FocusOnMountPlugin,
    editableOnly: true,
  },
  {
    flag: "draggableBlocks",
    plugin: DraggableBlockPlugin,
    editableOnly: true,
  },
  {
    flag: "floatingToolbar",
    plugin: FloatingToolbarPlugin,
    editableOnly: true,
  },
  {
    flag: "floatingLinkEditor",
    plugin: FloatingLinkEditorPlugin,
    editableOnly: true,
  },
  {
    flag: "slashCommand",
    editableOnly: true,
  },
];

/**
 * Mounted by the composition surface when the `slashCommand` flag is enabled.
 * Kept as a dedicated renderer because the plugin takes the resolved
 * `commandIds` rather than the whole flag set.
 */
export const renderSlashCommandPlugin = (commandIds: readonly string[]) => {
  const Plugin = SlashCommandPlugin;
  return <Plugin commandIds={commandIds} />;
};

/**
 * Mounted by the composition surface when the `seedContent` flag is enabled.
 * Dedicated renderer because seeding needs the resolved transformer set to
 * import default markdown content correctly.
 */
export const renderSeedContentPlugin = (
  transformers: readonly Transformer[]
) => {
  const Plugin = SeedContentPlugin;
  return <Plugin transformers={transformers} />;
};

/**
 * Collects the built-in node set for features currently enabled by the
 * resolved flags, so nodes follow their feature's opt-in/out instead of always
 * shipping together. Independently registered nodes (headings, lists, links,
 * code, tables) live in `core/config.ts`.
 */
export const resolveFeatureNodes = (
  resolved: EditorFeatureFlags
): LexicalNodeList => {
  const nodes: LexicalNodeList = [];

  for (const feature of EDITOR_FEATURES) {
    if (feature.nodes && resolved[feature.flag]) {
      nodes.push(...feature.nodes);
    }
  }

  return nodes;
};

/**
 * Collects the slash-command ids contributed by currently enabled features.
 * The shared insert menu is then filtered to these ids, keeping the list in
 * sync with the mounted plugin stack.
 */
export const resolveSlashCommandIds = (
  resolved: EditorFeatureFlags
): readonly SlashCommandId[] => {
  const ids: SlashCommandId[] = [];

  for (const feature of EDITOR_FEATURES) {
    if (feature.slashCommandIds && resolved[feature.flag]) {
      ids.push(...feature.slashCommandIds);
    }
  }

  return ids;
};

/**
 * Combines consumer-contributed features onto the built-in resolved feature
 * set. Extra features contribute nodes, plugins, transformers and slash
 * commands without any edit inside `core` or feature internals.
 */
export const computeFeatureNodes = (
  resolved: EditorFeatureFlags,
  extraFeatures?: readonly ExtraEditorFeature[]
): LexicalNodeList => {
  const nodes = resolveFeatureNodes(resolved);

  for (const extra of extraFeatures ?? []) {
    if (extra.nodes) {
      nodes.push(...extra.nodes);
    }
  }

  return nodes;
};

export const computeEditorTransformers = (
  resolved: EditorFeatureFlags,
  extraFeatures?: readonly ExtraEditorFeature[]
): readonly Transformer[] => {
  const transformers: Transformer[] = [...BUILTIN_MARKDOWN_TRANSFORMERS];

  for (const feature of EDITOR_FEATURES) {
    if (feature.transformers && resolved[feature.flag]) {
      transformers.push(...feature.transformers);
    }
  }

  for (const extra of extraFeatures ?? []) {
    if (extra.transformers) {
      transformers.push(...extra.transformers);
    }
  }

  return transformers;
};

export const resolveSlashCommandIdsWithExtras = (
  resolved: EditorFeatureFlags,
  extraFeatures?: readonly ExtraEditorFeature[]
): readonly string[] => {
  const ids: string[] = [...resolveSlashCommandIds(resolved)];

  for (const extra of extraFeatures ?? []) {
    if (extra.slashCommandIds) {
      ids.push(...extra.slashCommandIds);
    }
  }

  return ids;
};

export const resolveExtraFeaturePlugins = (
  extraFeatures?: readonly ExtraEditorFeature[]
): readonly { id: string; plugin: ComponentType }[] => {
  const plugins: { id: string; plugin: ComponentType }[] = [];

  for (const extra of extraFeatures ?? []) {
    if (extra.plugin) {
      plugins.push({ id: extra.id, plugin: extra.plugin });
    }
  }

  return plugins;
};
