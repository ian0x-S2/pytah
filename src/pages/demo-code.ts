export const DEMO_EDITOR_USAGE_EXAMPLE = `import { useState } from "react";
import type { EditorToolbar } from "@/components/editor/core/types";
import { Editor } from "@/components/editor/editor";
import { EditorWithToc } from "@/components/editor/plugins/toc/editor-with-toc";

export function DemoEditorExample() {
  const [editable, setEditable] = useState(true);
  const [toolbar, setToolbar] = useState<EditorToolbar>(false);
  const [showToc, setShowToc] = useState(false);

  const EditorComponent = showToc ? EditorWithToc : Editor;
  return <EditorComponent editable={editable} minimal toolbar={toolbar} />;
}`;
