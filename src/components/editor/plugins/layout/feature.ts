import { PanelsTopLeftIcon } from "lucide-react";
import { LayoutContainerNode } from "../../core/nodes/layout/container-node";
import { LayoutItemNode } from "../../core/nodes/layout/item-node";
import type { ExtraEditorFeature } from "../../core/types";
import { INSERT_LAYOUT_COMMAND } from "./commands";
import { LayoutPlugin } from "./plugin";

/**
 * Installs the layout feature: the container/item nodes, the column preset
 * picker and the shared insert-menu entry. Ships as the `editor-layouts`
 * registry item.
 */
export const layoutFeature: ExtraEditorFeature = {
  id: "layout",
  nodes: [LayoutContainerNode, LayoutItemNode],
  plugin: LayoutPlugin,
  slashCommands: [
    {
      command: {
        description: "Multi-column content layout",
        icon: PanelsTopLeftIcon,
        id: "columns",
        keywords: ["columns", "layout", "grid", "multi-column"],
        label: "Columns",
      },
      run: (editor) => {
        editor.dispatchCommand(INSERT_LAYOUT_COMMAND, {});
      },
    },
  ],
};
