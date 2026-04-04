import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
} from "@/components/docs/primitives";

export function DraggableBlockGuidePage() {
  return (
    <>
      <PageHeader
        badge="Feature Guide"
        description="Feature guide for the draggable block handle that reorders top-level blocks inside the editor."
        title="Draggable Block"
      />

      <Callout title="Feature guide" variant="info">
        This is a built-in editor capability. If you only need to disable it in
        an integration, prefer the editor <code>features</code> prop rather than
        editing plugin internals.
      </Callout>

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/plugins/draggable-block/",
          "  plugin.tsx        ← DraggableBlockPlugin",
        ]}
      />

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        <code>DraggableBlockPlugin</code> wraps Lexical's experimental{" "}
        <code>DraggableBlockPlugin_EXPERIMENTAL</code>. It listens for the root
        element via <code>registerRootListener</code> to obtain the{" "}
        <code>anchorElem</code> (the root's parent container) and only renders
        when the editor is editable. The grip handle is a{" "}
        <code>GripVerticalIcon</code> that appears on hover, and a thin primary-
        coloured line shows the drop target position.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/draggable-block/plugin.tsx">
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { GripVerticalIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_MENU_CLASS_NAME = "editor-draggable-block-menu";

export function DraggableBlockPlugin() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      setAnchorElem(rootElement?.parentElement ?? null);
    });
  }, [editor]);

  const isOnMenu = useCallback(
    (element: HTMLElement) =>
      Boolean(element.closest(\`.\${DRAG_MENU_CLASS_NAME}\`)),
    []
  );

  if (!(isEditable && anchorElem)) {
    return null;
  }

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      isOnMenu={isOnMenu}
      menuComponent={
        <div
          className={\`\${DRAG_MENU_CLASS_NAME} absolute top-0 left-0 z-40 flex cursor-grab items-center gap-0.5 rounded-md p-0.5 text-muted-foreground opacity-0 transition-[transform,opacity] duration-150 ease-in-out active:cursor-grabbing\`}
          ref={menuRef}
        >
          <div className="flex size-4 items-center justify-center rounded-sm opacity-50 transition hover:bg-muted hover:opacity-100">
            <GripVerticalIcon className="size-3.5" />
          </div>
        </div>
      }
      menuRef={menuRef}
      targetLineComponent={
        <div
          className="pointer-events-none absolute top-0 left-0 z-30 h-1 rounded-full bg-primary opacity-0"
          ref={targetLineRef}
        />
      }
      targetLineRef={targetLineRef}
    />
  );
}`}
      </CodeBlock>

      <SectionHeading id="registration">Registration</SectionHeading>
      <Paragraph>
        Mount <code>DraggableBlockPlugin</code> inside your composer. No custom
        nodes are required — the plugin works with any top-level block.
      </Paragraph>
      <CodeBlock language="tsx">
        {`// ui/content.tsx — mount the plugin
import { DraggableBlockPlugin } from "../plugins/draggable-block/plugin";
<DraggableBlockPlugin />`}
      </CodeBlock>

      <Callout title="Editor-only" variant="tip">
        <code>DraggableBlockPlugin</code> checks{" "}
        <code>useLexicalEditable()</code> and renders <code>null</code> in
        read-only mode, so it is safe to mount unconditionally.
      </Callout>

      <Callout title="Anchor element" variant="info">
        The plugin needs the root element's <em>parent</em> as the anchor so the
        floating grip can be positioned outside the scrollable content area.{" "}
        <code>registerRootListener</code> fires once on mount (and again if the
        root changes), so <code>anchorElem</code> is always up to date.
      </Callout>
    </>
  );
}
