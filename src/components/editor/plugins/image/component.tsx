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
  type NodeKey,
} from "lexical";
import { useEffect, useMemo, useRef, useState } from "react";
import { $isImageNode, type ImageAlignment } from "../../core/nodes/image/node";
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
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const effectiveWidth = width === "inherit" ? DEFAULT_IMAGE_WIDTH : width;
  const isInNodeSelection = useMemo(() => {
    if (!isSelected) {
      return false;
    }

    return editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isNodeSelection(selection) && selection.has(nodeKey);
    });
  }, [editor, isSelected, nodeKey]);
  const isFocused = (isSelected || isResizing) && editable;
  let figureClassName = "my-4 w-fit max-w-full";
  let alignmentClassName = "inline-flex max-w-full";

  if (alignment === "center") {
    figureClassName = "my-4 w-full";
    alignmentClassName = "flex max-w-full justify-center";
  } else if (alignment === "right") {
    figureClassName = "my-4 ml-auto w-fit max-w-full";
    alignmentClassName = "flex max-w-full justify-end";
  }

  useEffect(() => {
    if (!editable) {
      return;
    }

    const removeSelectedImage = (event: KeyboardEvent) => {
      const selection = $getSelection();
      if (!(isSelected && $isNodeSelection(selection))) {
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
            setSelected(!isSelected);
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
          if (!isSelected) {
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
    isResizing,
    isSelected,
    nodeKey,
    setSelected,
  ]);

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("-webkit-user-select");
      document.body.style.removeProperty("user-select");
    };
  }, []);

  return (
    <figure className={figureClassName}>
      <div className={alignmentClassName}>
        <div className="relative inline-flex max-w-full">
          <div
            className={
              isFocused
                ? "rounded-2xl ring-1 ring-primary/40 ring-offset-2 ring-offset-background"
                : "rounded-2xl"
            }
          >
            <img
              alt={altText}
              className="block h-auto max-w-full rounded-xl border border-border/60 bg-muted/20 shadow-xs"
              draggable="false"
              height={height === "inherit" ? undefined : height}
              ref={imageRef}
              src={src}
              width={effectiveWidth}
            />
          </div>

          {editable && isInNodeSelection && isFocused ? (
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
