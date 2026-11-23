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
  FORMAT_ELEMENT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical";
import type { LexicalEditor, NodeKey } from "lexical";
import { PencilIcon } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { $isExcalidrawNode } from "../../core/nodes/excalidraw/node";
import type { ExcalidrawAlignment } from "../../core/nodes/excalidraw/node";
import { ImageResizer } from "../image/resizer";
import { ExcalidrawImage } from "./image";
import { ExcalidrawEditorDialog } from "./modal";
import type { SaveExcalidrawScenePayload } from "./modal";
import {
  hasExcalidrawContent,
  parseExcalidrawScene,
  serializeExcalidrawScene,
} from "./scene";

interface ExcalidrawComponentProps {
  alignment: ExcalidrawAlignment;
  data: string;
  height: number | "inherit";
  nodeKey: NodeKey;
  width: number | "inherit";
}

interface SelectionBehaviorOptions {
  buttonRef: RefObject<HTMLButtonElement | null>;
  clearSelection: () => void;
  editable: boolean;
  isNodeSelected: boolean;
  isResizing: boolean;
  nodeKey: NodeKey;
  openEditor: () => void;
  removeNode: () => void;
  setSelected: (selected: boolean) => void;
}

const isInsideButton = (
  button: HTMLButtonElement | null,
  target: EventTarget | null
): boolean =>
  Boolean(button && target instanceof Node && button.contains(target));

const useExcalidrawSelectionBehavior = ({
  buttonRef,
  clearSelection,
  editable,
  isNodeSelected,
  isResizing,
  nodeKey,
  openEditor,
  removeNode,
  setSelected,
}: SelectionBehaviorOptions) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editable) {
      if (isNodeSelected) {
        clearSelection();
      }
      return;
    }

    const removeSelectedDrawing = (event: KeyboardEvent) => {
      if (!isNodeSelected) {
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
            setSelected(!isNodeSelected);
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
        FORMAT_ELEMENT_COMMAND,
        (format) => {
          if (!isNodeSelected) {
            return false;
          }

          if (
            !(format === "left" || format === "center" || format === "right")
          ) {
            return false;
          }

          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isExcalidrawNode(node)) {
              node.setAlignment(format as ExcalidrawAlignment);
            }
          });

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
    isNodeSelected,
    isResizing,
    nodeKey,
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
  alignment: ExcalidrawAlignment;
  buttonRef: RefObject<HTMLButtonElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  editable: boolean;
  editor: LexicalEditor;
  height: number | "inherit";
  isFocused: boolean;
  nodeKey: NodeKey;
  onResizeEnd: (nextWidth: number, nextHeight: number) => void;
  onResizeStart: () => void;
  openEditor: () => void;
  scene: ReturnType<typeof parseExcalidrawScene>;
  width: number | "inherit";
}

function ExcalidrawPreview({
  alignment,
  buttonRef,
  containerRef,
  editable,
  editor,
  height,
  isFocused,
  nodeKey: _nodeKey,
  onResizeEnd,
  onResizeStart,
  openEditor,
  scene,
  width,
}: ExcalidrawPreviewProps) {
  let figureClassName = "my-4 w-fit max-w-full";
  let alignmentClassName = "inline-flex max-w-full";

  if (alignment === "center") {
    figureClassName = "my-4 w-full";
    alignmentClassName = "flex max-w-full justify-center";
  } else if (alignment === "right") {
    figureClassName = "my-4 ml-auto w-fit max-w-full";
    alignmentClassName = "flex max-w-full justify-end";
  }

  const imageElement = (
    <ExcalidrawImage
      appState={scene.appState}
      containerRef={containerRef}
      elements={scene.elements}
      files={scene.files}
      height={height}
      width={width}
    />
  );

  return (
    <figure className={figureClassName}>
      <div className={alignmentClassName}>
        <div className="relative inline-flex max-w-full">
          <div
            className={
              isFocused
                ? "rounded-md ring-1 ring-primary/40 ring-offset-2 ring-offset-background"
                : "rounded-md"
            }
          >
            {editable ? (
              <button
                aria-label="Drawing preview, press Enter or double-click to edit"
                className="block cursor-default overflow-hidden rounded-md border border-border/60 bg-muted/20 shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openEditor();
                  }
                }}
                ref={buttonRef}
                type="button"
              >
                {imageElement}
              </button>
            ) : (
              <div className="block overflow-hidden rounded-md border border-border/60 bg-muted/20 shadow-xs">
                {imageElement}
              </div>
            )}
          </div>

          {isFocused ? (
            <ImageResizer
              decorations={
                <button
                  aria-label="Edit drawing"
                  className="absolute -top-3 right-2 z-10 flex size-6 items-center justify-center rounded-md bg-popover shadow-lg ring-1 ring-border transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditor();
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  type="button"
                >
                  <PencilIcon
                    aria-hidden
                    className="size-3 text-muted-foreground"
                  />
                </button>
              }
              edgeHandles
              editor={editor}
              imageRef={containerRef}
              onResizeEnd={onResizeEnd}
              onResizeStart={onResizeStart}
            />
          ) : null}
        </div>
      </div>
    </figure>
  );
}

export function ExcalidrawComponent({
  alignment,
  data,
  height,
  nodeKey,
  width,
}: ExcalidrawComponentProps) {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const [, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);
  const [isNodeSelected, setIsNodeSelected] = useState(() =>
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isNodeSelection(selection) && selection.has(nodeKey);
    })
  );

  useEffect(() => {
    const syncNodeSelection = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        setIsNodeSelected(
          $isNodeSelection(selection) && selection.has(nodeKey)
        );
      });
    };

    syncNodeSelection();
    return editor.registerUpdateListener(syncNodeSelection);
  }, [editor, nodeKey]);

  const scene = useMemo(() => parseExcalidrawScene(data), [data]);
  const hasContent = hasExcalidrawContent(scene);
  const [isEditorOpen, setIsEditorOpen] = useState(
    () => !hasContent && editable
  );
  const wasEmptyOnMountRef = useRef(!hasContent);
  const resizeEndTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const removeNode = useCallback(
    () =>
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isExcalidrawNode(node)) {
          node.remove();
        }
      }),
    [editor, nodeKey]
  );

  const openEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  useExcalidrawSelectionBehavior({
    buttonRef,
    clearSelection,
    editable,
    isNodeSelected,
    isResizing,
    nodeKey,
    openEditor,
    removeNode,
    setSelected,
  });

  useEffect(
    () => () => {
      if (resizeEndTimeoutRef.current !== null) {
        window.clearTimeout(resizeEndTimeoutRef.current);
        resizeEndTimeoutRef.current = null;
      }
      editor.getRootElement()?.style.removeProperty("cursor");
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("-webkit-user-select");
      document.body.style.removeProperty("user-select");
    },
    [editor]
  );

  if (!editable && !hasContent) {
    return null;
  }

  const isFocused = (isNodeSelected || isResizing) && editable;

  const restoreEditorFocus = () => {
    requestAnimationFrame(() => {
      editor.getRootElement()?.focus({ preventScroll: true });
    });
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);

    if (wasEmptyOnMountRef.current && !hasContent) {
      removeNode();
    }

    restoreEditorFocus();
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

    restoreEditorFocus();
  };

  const handleResizeEnd = (nextWidth: number, nextHeight: number) => {
    if (resizeEndTimeoutRef.current !== null) {
      window.clearTimeout(resizeEndTimeoutRef.current);
    }
    resizeEndTimeoutRef.current = window.setTimeout(() => {
      resizeEndTimeoutRef.current = null;
      setIsResizing(false);
    }, 200);

    applyDimensions(editor, nodeKey, nextWidth, nextHeight);
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

      {hasContent ? (
        <ExcalidrawPreview
          alignment={alignment}
          buttonRef={buttonRef}
          containerRef={containerRef}
          editable={editable}
          editor={editor}
          height={height}
          isFocused={isFocused}
          nodeKey={nodeKey}
          onResizeEnd={handleResizeEnd}
          onResizeStart={() => setIsResizing(true)}
          openEditor={openEditor}
          scene={scene}
          width={width}
        />
      ) : null}
    </>
  );
}
