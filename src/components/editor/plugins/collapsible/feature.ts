import type { ElementNode } from "lexical";
import { ChevronRightIcon } from "lucide-react";
import { CollapsibleContainerNode } from "../../core/nodes/collapsible/container-node";
import { CollapsibleContentNode } from "../../core/nodes/collapsible/content-node";
import { CollapsibleTitleNode } from "../../core/nodes/collapsible/title-node";
import type { ExtraEditorFeature } from "../../core/types";
import { replaceCurrentBlock } from "../slash-command/utils";
import { CollapsiblePlugin } from "./plugin";
import { replaceElementWithCollapsible } from "./utils";

const applyCollapsibleCommand = (targetElement: ElementNode): void => {
  replaceElementWithCollapsible(targetElement);
};

/**
 * Installs the collapsible feature: the container/title/content nodes, the
 * behavior plugin (indentation, selection, keyboard flows) and the shared
 * insert-menu entry. Ships as the `editor-collapsible` registry item.
 */
export const collapsibleFeature: ExtraEditorFeature = {
  id: "collapsible",
  nodes: [
    CollapsibleContainerNode,
    CollapsibleTitleNode,
    CollapsibleContentNode,
  ],
  plugin: CollapsiblePlugin,
  slashCommands: [
    {
      command: {
        description: "Expandable toggle section",
        icon: ChevronRightIcon,
        id: "collapsible",
        keywords: ["collapsible", "toggle", "details", "accordion"],
        label: "Collapsible",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyCollapsibleCommand);
      },
    },
  ],
};
