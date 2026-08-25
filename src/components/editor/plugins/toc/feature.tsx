"use client";

import type { ExtraEditorFeature } from "../../core/types";
import { EditorTableOfContents } from "./sidebar";

/**
 * Default TOC placement: a fixed sidebar on the right edge of the viewport.
 * Consumers who need custom placement can render `EditorTableOfContents`
 * themselves inside any editor slot instead of using this descriptor (see
 * `EditorWithToc` for a slots-based composition).
 */
export function TocFeaturePlugin() {
  return (
    <div className="pointer-events-none fixed top-24 right-6 z-30 hidden xl:block">
      <div className="pointer-events-auto">
        <EditorTableOfContents />
      </div>
    </div>
  );
}

/**
 * Installs the table-of-contents sidebar. Ships as the `editor-toc` registry
 * item.
 */
export const tocFeature: ExtraEditorFeature = {
  id: "toc",
  plugin: TocFeaturePlugin,
};
