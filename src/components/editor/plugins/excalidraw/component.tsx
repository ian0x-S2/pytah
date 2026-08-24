"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { PencilIcon } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { $isExcalidrawNode } from "../../core/nodes/excalidraw/node";
import { ImageResizer } from "../image/resizer";
import { ExcalidrawImage } from "./image";
import {
  ExcalidrawEditorDialog,
  type SaveExcalidrawScenePayload,
} from "./modal";
import {
  hasExcalidrawContent,
  parseExcalidrawScene,
  serializeExcalidrawScene,
} from "./scene";

interface ExcalidrawComponentProps {
  data: string;
  height: number | "inherit";
  nodeKey: NodeKey;
  width: number | "inherit";
}

interface SelectionBehaviorOptions {
  buttonRef: RefObject<HTMLButtonElement | null>;
  clearSelection: () => void;
  editable: boolean;
  isResizing: boolean;
  isSelected: boolean;
  openEditor: () => void;
  removeNode: () => void;
  setSelected: (selected: boolean) => void;
}

const isInsideButton = (
  button: HTMLButtonElement | null,
  target: EventTarget | null
): boolean => {
  return Boolean(button && target instanceof Node && button.contains(target));
};

/**
 * Wires click-to-select, double-click-to-edit, drag suppression and
 * delete-key removal for one drawing block.
 */
const useExcalidrawSelectionBehavior = ({
  buttonRef,
  clearSelection,
  editable,
  isResizing,
  isSelected,
  openEditor,
  removeNode,
  setSelected,
}: SelectionBehaviorOptions) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editable) {
      if (isSelected) {
        clearSelection();
      }
      return;
    }

    const removeSelectedDrawing = (event: KeyboardEvent) => {
      const selection = $getSelection();
      if (!(isSelected && $isNodeSelection(selection))) {
        return false;
      }

      event.preventDefault();
      removeNode();
      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          if (isResizing) {
            return true;
          }

          if (!isInsideButton(buttonRef.current, event.target)) {
            return false;
          }

          if (event.shiftKey) {
            setSelected(!isSelected);
          } else {
            clearSelection();
            setSelected(true);
          }

          if (event.detail > 1) {
            openEditor();
          }

          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (!isInsideButton(buttonRef.current, event.target)) {
            return false;
          }

          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        removeSelectedDrawing,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        removeSelectedDrawing,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [
    buttonRef,
    clearSelection,
    editable,
    editor,
    isResizing,
    isSelected,
    openEditor,
    removeNode,
    setSelected,
  ]);
};

const applyDimensions = (
  editor: LexicalEditor,
  nodeKey: NodeKey,
  nextWidth: number | "inherit",
  nextHeight: number | "inherit"
) => {
  editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if ($isExcalidrawNode(node)) {
      node.setWidth(nextWidth);
      node.setHeight(nextHeight);
    }
  });
};

interface ExcalidrawPreviewProps {
  buttonRef: RefObject<HTMLButtonElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  editable: boolean;
  editor: LexicalEditor;
  height: number | "inherit";
  isSelected: boolean;
  nodeKey: NodeKey;
  openEditor: () => void;
  scene: ReturnType<typeof parseExcalidrawScene>;
  setIsResizing: (isResizing: boolean) => void;
  width: number | "inherit";
}

function ExcalidrawPreview({
  buttonRef,
  containerRef,
  editable,
  editor,
  height,
  isSelected,
  nodeKey,
  openEditor,
  scene,
  setIsResizing,
  width,
}: ExcalidrawPreviewProps) {
  return (
    <figure className="my-4 w-fit max-w-full">
      <div className="relative inline-flex max-w-full">
        <div
          className={
            isSelected && editable
              ? "rounded-xl ring-1 ring-primary/40 ring-offset-2 ring-offset-background"
              : "rounded-xl"
          }
        >
          <button
            aria-label="Drawing preview, double-click to edit"
            className="block cursor-default overflow-hidden rounded-lg border border-border/60 bg-muted/20 shadow-xs"
            ref={buttonRef}
            type="button"
          >
            <ExcalidrawImage
              appState={scene.appState}
              containerRef={containerRef}
              elements={scene.elements}
              files={scene.files}
              height={height}
              width={width}
            />
          </button>
        </div>

        {/*
         * The edit button lives inside the resizer's bounds-synced overlay so
         * it hugs the handles at the drawing's true top-right corner. Anchoring
         * it to this container instead would let it drift away whenever the
         * committed width exceeds the clamped container (`max-w-full`).
         */}
        {editable && isSelected ? (
          <ImageResizer
            decorations={
              <button
                aria-label="Edit drawing"
                className="absolute -top-3 right-2 z-10 flex size-6 items-center justify-center rounded-md bg-popover shadow-lg ring-1 ring-border transition-colors hover:bg-accent"
                onClick={(event) => {
                  event.stopPropagation();
                  openEditor();
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                type="button"
              >
                <PencilIcon className="size-3 text-muted-foreground" />
              </button>
            }
            edgeHandles
            editor={editor}
            imageRef={containerRef}
            onResizeEnd={(nextWidth, nextHeight) => {
              window.setTimeout(() => {
                setIsResizing(false);
              }, 200);

              applyDimensions(editor, nodeKey, nextWidth, nextHeight);
            }}
            onResizeStart={() => {
              setIsResizing(true);
            }}
          />
        ) : null}
      </div>
    </figure>
  );
}

export function ExcalidrawComponent({
  data,
  height,
  nodeKey,
  width,
}: ExcalidrawComponentProps) {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);

  const scene = useMemo(() => parseExcalidrawScene(data), [data]);
  // A drawing inserted through the slash menu, toolbar insert or the plugin
  // command starts empty and opens its editing surface right away.
  const [isEditorOpen, setIsEditorOpen] = useState(
    () => scene.elements.length === 0 && editable
  );
  const wasEmptyOnMountRef = useRef(scene.elements.length === 0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const removeNode = useCallback(() => {
    return editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isExcalidrawNode(node)) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const openEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  useExcalidrawSelectionBehavior({
    buttonRef,
    clearSelection,
    editable,
    isResizing,
    isSelected,
    openEditor,
    removeNode,
    setSelected,
  });

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("-webkit-user-select");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  if (!editable && scene.elements.length === 0) {
    return null;
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false);

    if (wasEmptyOnMountRef.current && !hasExcalidrawContent(scene)) {
      removeNode();
    }
  };

  const handleSaveEditor = (payload: SaveExcalidrawScenePayload) => {
    const { appState, elements, files } = payload;
    setIsEditorOpen(false);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isExcalidrawNode(node)) {
        return;
      }

      if (hasExcalidrawContent({ elements, files })) {
        node.setData(serializeExcalidrawScene(elements, appState, files));
        return;
      }

      node.remove();
    });
  };

  return (
    <>
      {isEditorOpen ? (
        <ExcalidrawEditorDialog
          initialScene={scene}
          onClose={handleCloseEditor}
          onSave={handleSaveEditor}
        />
      ) : null}

      {scene.elements.length > 0 ? (
        <ExcalidrawPreview
          buttonRef={buttonRef}
          containerRef={containerRef}
          editable={editable}
          editor={editor}
          height={height}
          isSelected={isSelected}
          nodeKey={nodeKey}
          openEditor={openEditor}
          scene={scene}
          setIsResizing={setIsResizing}
          width={width}
        />
      ) : null}
    </>
  );
}
