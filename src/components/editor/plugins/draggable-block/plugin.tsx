import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
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
      Boolean(element.closest(`.${DRAG_MENU_CLASS_NAME}`)),
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
          className={`${DRAG_MENU_CLASS_NAME} absolute top-0 left-0 z-40 flex cursor-grab items-center gap-0.5 rounded-md p-0.5 text-muted-foreground opacity-0 transition-[transform,opacity] duration-150 ease-in-out active:cursor-grabbing`}
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
}
