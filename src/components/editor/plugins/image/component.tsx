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
import type { NodeKey } from "lexical";
import { useEffect, useRef, useState } from "react";

import { $isImageNode } from "../../core/nodes/image/node";
import type { ImageAlignment } from "../../core/nodes/image/node";
import { ImageResizer } from "./resizer";

interface ImageComponentProps {
  alignment: ImageAlignment;
  altText: string;
  height: number | "inherit";
  nodeKey: NodeKey;
  src: string;
  width: number | "inherit";
}

const DEFAULT_IMAGE_WIDTH = 640;

export function ImageComponent({
  alignment,
  altText,
  height,
  nodeKey,
  src,
  width,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const [, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isNodeSelected, setIsNodeSelected] = useState(() =>
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isNodeSelection(selection) && selection.has(nodeKey);
    })
  );
  const effectiveWidth = width === "inherit" ? DEFAULT_IMAGE_WIDTH : width;

  // `useLexicalNodeSelection` reports `node.isSelected()`, which is also true
  // when a range selection merely spans the image (e.g. a document-wide
  // select-all). The resize chrome must follow the image's own NodeSelection
  // instead: after a select-all that hook state is already `true`, so clicking
  // the image (which creates the NodeSelection) would not re-render and the
  // handles would never mount. Track membership explicitly so every
  // range → NodeSelection transition commits.
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

  const isFocused = (isNodeSelected || isResizing) && editable;
  let figureClassName = "editor-image-figure w-fit";
  let alignmentClassName = "inline-flex max-w-full";

  if (alignment === "center") {
    figureClassName = "editor-image-figure w-full";
    alignmentClassName = "flex max-w-full justify-center";
  } else if (alignment === "right") {
    figureClassName = "editor-image-figure ml-auto w-fit";
    alignmentClassName = "flex max-w-full justify-end";
  }

  useEffect(() => {
    if (!editable) {
      return;
    }

    const removeSelectedImage = (event: KeyboardEvent) => {
      if (!isNodeSelected) {
        return false;
      }

      event.preventDefault();

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
      });

      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          if (isResizing) {
            return true;
          }

          if (event.target !== imageRef.current) {
            return false;
          }

          if (event.shiftKey) {
            setSelected(!isNodeSelected);
          } else {
            clearSelection();
            setSelected(true);
          }

          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault();
            return true;
          }

          return false;
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
            if ($isImageNode(node)) {
              node.setAlignment(format as ImageAlignment);
            }
          });

          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        removeSelectedImage,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        removeSelectedImage,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [
    clearSelection,
    editable,
    editor,
    isNodeSelected,
    isResizing,
    nodeKey,
    setSelected,
  ]);

  useEffect(
    () => () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("-webkit-user-select");
      document.body.style.removeProperty("user-select");
    },
    []
  );

  return (
    <figure className={figureClassName}>
      <div className={alignmentClassName}>
        <div className="relative inline-flex max-w-full">
          <div
            className={
              isFocused ? "editor-image-frame-selected" : "editor-image-frame"
            }
          >
            <img
              alt={altText}
              className="editor-image-img h-auto shadow-xs"
              draggable="false"
              height={height === "inherit" ? undefined : height}
              ref={imageRef}
              src={src}
              width={effectiveWidth}
            />
          </div>

          {isFocused ? (
            <ImageResizer
              editor={editor}
              imageRef={imageRef}
              onResizeEnd={(nextWidth, nextHeight) => {
                window.setTimeout(() => {
                  setIsResizing(false);
                }, 200);

                editor.update(() => {
                  const node = $getNodeByKey(nodeKey);
                  if ($isImageNode(node)) {
                    node.setWidthAndHeight(nextWidth, nextHeight);
                  }
                });
              }}
              onResizeStart={() => {
                setIsResizing(true);
              }}
            />
          ) : null}
        </div>
      </div>
    </figure>
  );
}
