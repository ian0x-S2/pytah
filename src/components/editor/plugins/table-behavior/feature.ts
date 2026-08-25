import type { ExtraEditorFeature } from "../../core/types";
import { TableBehaviorPlugin } from "./plugin";

/**
 * Installs the table *behavior* feature: cell menus, row/column actions and
 * merge controls. The base `TableNode`, its markdown transformer and the
 * insert command stay in core so tables keep working for paste even when
 * this item is not installed — it only upgrades the editing UX. Ships as the
 * `editor-tables` registry item.
 */
export const tableFeature: ExtraEditorFeature = {
  id: "tables",
  plugin: TableBehaviorPlugin,
};
