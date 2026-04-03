import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";

export function ImageGuidePage() {
  return (
    <>
      <PageHeader
        description="Full walkthrough of ImageNode, ImagePlugin (insert / paste / drop), ImageComponent (click / select / delete / alignment), and ImageResizer (4-corner pointer drag)."
        title="Image"
      />

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/core/nodes/image/",
          "  node.tsx          ← DecoratorNode + serialization",
          "src/components/editor/plugins/image/",
          "  commands.ts       ← INSERT_IMAGE_COMMAND",
          "  utils.ts          ← file helpers",
          "  plugin.tsx        ← ImagePlugin (insert / paste / drop)",
          "  component.tsx     ← ImageComponent (click / select / delete / align)",
          "  resizer.tsx       ← ImageResizer (4-corner drag-to-resize)",
        ]}
      />

      <SectionHeading id="node">node.tsx</SectionHeading>
      <Paragraph>
        <code>ImageNode</code> extends <code>DecoratorNode</code> and stores{" "}
        <code>src</code>, <code>altText</code>, <code>alignment</code>,{" "}
        <code>width</code>, and <code>height</code>. It renders its React
        component via <code>decorate()</code> and handles HTML paste via{" "}
        <code>importDOM</code>.
      </Paragraph>
      <CodeBlock language="src/components/editor/core/nodes/image/node.tsx">
        {`import { addClassNamesToElement } from "@lexical/utils";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { DecoratorNode } from "lexical";
import type { JSX } from "react";
import { ImageComponent } from "../../../plugins/image/component";

export type SerializedImageNode = Spread<
  {
    alignment?: ImageAlignment;
    altText: string;
    height: number | "inherit";
    src: string;
    width: number | "inherit";
  },
  SerializedLexicalNode
>;

export type ImageAlignment = "left" | "center" | "right";

export interface ImagePayload {
  alignment?: ImageAlignment;
  altText: string;
  height?: number | "inherit";
  key?: NodeKey;
  src: string;
  width?: number | "inherit";
}

const getImageAlignment = (domNode: HTMLImageElement): ImageAlignment => {
  const align = domNode.getAttribute("align");
  if (align === "center" || align === "right" || align === "left") return align;
  const { marginLeft, marginRight } = domNode.style;
  if (marginLeft === "auto" && marginRight === "auto") return "center";
  if (marginLeft === "auto") return "right";
  return "left";
};

const convertImageElement = (domNode: Node): DOMConversionOutput | null => {
  if (!(domNode instanceof HTMLImageElement)) return null;
  const src = domNode.getAttribute("src");
  if (!src || src.startsWith("file:///")) return null;
  return {
    node: $createImageNode({
      alignment: getImageAlignment(domNode),
      altText: domNode.getAttribute("alt") ?? "",
      height: domNode.height || undefined,
      src,
      width: domNode.width || undefined,
    }),
  };
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __alignment: ImageAlignment;
  __altText: string;
  __height: number | "inherit";
  __src: string;
  __width: number | "inherit";

  constructor(
    src: string,
    altText: string,
    alignment: ImageAlignment = "left",
    width: number | "inherit" = "inherit",
    height: number | "inherit" = "inherit",
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__alignment = alignment;
    this.__width = width;
    this.__height = height;
  }

  static getType(): string { return "image"; }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src, node.__altText, node.__alignment,
      node.__width, node.__height, node.__key
    );
  }

  static importDOM(): DOMConversionMap | null {
    return { img: () => ({ conversion: convertImageElement, priority: 2 }) };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      alignment: serializedNode.alignment,
      altText: serializedNode.altText,
      height: serializedNode.height,
      src: serializedNode.src,
      width: serializedNode.width,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
    return super
      .updateFromJSON(serializedNode)
      .setAlignment(serializedNode.alignment ?? "left")
      .setAltText(serializedNode.altText)
      .setHeight(serializedNode.height)
      .setSrc(serializedNode.src)
      .setWidth(serializedNode.width);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    element.style.display = "block";
    if (this.__alignment === "center") {
      element.style.marginLeft = "auto";
      element.style.marginRight = "auto";
    } else if (this.__alignment === "right") {
      element.style.marginLeft = "auto";
      element.style.marginRight = "0";
    }
    if (this.__width !== "inherit") element.width = this.__width;
    if (this.__height !== "inherit") element.height = this.__height;
    return { element };
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      alignment: this.__alignment,
      altText: this.__altText,
      height: this.__height,
      src: this.__src,
      type: "image",
      version: 1,
      width: this.__width,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    if (typeof config.theme.image === "string") {
      addClassNamesToElement(span, config.theme.image);
    }
    return span;
  }

  updateDOM(): false { return false; }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        alignment={this.__alignment}
        altText={this.__altText}
        height={this.__height}
        nodeKey={this.getKey()}
        src={this.__src}
        width={this.__width}
      />
    );
  }

  isInline(): false { return false; }

  getSrc(): string { return this.getLatest().__src; }
  getAltText(): string { return this.getLatest().__altText; }
  getAlignment(): ImageAlignment { return this.getLatest().__alignment; }
  getWidth(): number | "inherit" { return this.getLatest().__width; }
  getHeight(): number | "inherit" { return this.getLatest().__height; }

  setAltText(altText: string): this {
    const writable = this.getWritable();
    writable.__altText = altText;
    return writable;
  }
  setAlignment(alignment: ImageAlignment): this {
    const writable = this.getWritable();
    writable.__alignment = alignment;
    return writable;
  }
  setWidth(width: number | "inherit"): this {
    const writable = this.getWritable();
    writable.__width = width;
    return writable;
  }
  setWidthAndHeight(width: number | "inherit", height: number | "inherit"): this {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
    return writable;
  }
  setHeight(height: number | "inherit"): this {
    const writable = this.getWritable();
    writable.__height = height;
    return writable;
  }
  setSrc(src: string): this {
    const writable = this.getWritable();
    writable.__src = src;
    return writable;
  }
}

export function $createImageNode({
  alignment, altText, height, key, src, width,
}: ImagePayload): ImageNode {
  return new ImageNode(
    src, altText,
    alignment ?? "left",
    width ?? "inherit",
    height ?? "inherit",
    key
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}`}
      </CodeBlock>

      <SectionHeading id="commands">commands.ts</SectionHeading>
      <CodeBlock language="src/components/editor/plugins/image/commands.ts">
        {`import type { NodeKey } from "lexical";
import { createCommand } from "lexical";
import type { ImageAlignment } from "../../core/nodes/image/node";

export interface InsertImagePayload {
  alignment?: ImageAlignment;
  altText: string;
  src: string;
  targetNodeKey?: NodeKey;
}

export const INSERT_IMAGE_COMMAND = createCommand<InsertImagePayload>(
  "INSERT_IMAGE_COMMAND"
);`}
      </CodeBlock>

      <SectionHeading id="utils">utils.ts</SectionHeading>
      <Paragraph>
        Three small helpers used by the plugin to detect and read image files
        from clipboard / drop events.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/image/utils.ts">
        {`const IMAGE_MIME_PREFIX = "image/";

export const isImageFile = (file: File): boolean =>
  file.type.startsWith(IMAGE_MIME_PREFIX);

export const getFirstImageFile = (files: Iterable<File>): File | null => {
  for (const file of files) {
    if (isImageFile(file)) return file;
  }
  return null;
};

export const readFileAsDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") { resolve(reader.result); return; }
      reject(new Error("Image file could not be read as a data URL."));
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read image file."));
    });
    reader.readAsDataURL(file);
  });`}
      </CodeBlock>

      <SectionHeading id="plugin">plugin.tsx</SectionHeading>
      <Paragraph>
        Registers three Lexical commands: <code>INSERT_IMAGE_COMMAND</code>{" "}
        (inserts by URL), <code>DRAG_DROP_PASTE</code> (handles file drops), and{" "}
        <code>PASTE_COMMAND</code> (intercepts image file pastes).
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/image/plugin.tsx">
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE, eventFiles } from "@lexical/rich-text";
import {
  $createParagraphNode, $getNodeByKey, $getSelection,
  $insertNodes, $isElementNode, $isRangeSelection,
  COMMAND_PRIORITY_EDITOR, COMMAND_PRIORITY_HIGH,
  DROP_COMMAND, PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $createImageNode, $isImageNode } from "../../core/nodes/image/node";
import { INSERT_IMAGE_COMMAND } from "./commands";
import { getFirstImageFile, readFileAsDataUrl } from "./utils";

const insertParagraphAfterImage = (
  imageNode: ReturnType<typeof $createImageNode>
) => {
  if (!$isImageNode(imageNode)) return;
  const paragraph = $createParagraphNode();
  imageNode.insertAfter(paragraph);
  paragraph.select();
};

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const insertImage = ({ alignment, altText, src, targetNodeKey }: {
      alignment?: "left" | "center" | "right";
      altText: string;
      src: string;
      targetNodeKey?: string;
    }) => {
      const trimmedSrc = src.trim();
      if (!trimmedSrc) return false;
      const imageNode = $createImageNode({ alignment, altText: altText.trim(), src: trimmedSrc });

      if (targetNodeKey) {
        const targetNode = $getNodeByKey(targetNodeKey);
        if (!$isElementNode(targetNode)) return false;
        targetNode.replace(imageNode);
        insertParagraphAfterImage(imageNode);
        return true;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;
      $insertNodes([imageNode]);
      insertParagraphAfterImage(imageNode);
      return true;
    };

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND, (payload) => insertImage(payload),
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  useEffect(() => {
    const insertImageFile = async (file: File) => {
      const src = await readFileAsDataUrl(file);
      editor.update(() => {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, { altText: file.name, src });
      });
    };

    return editor.registerCommand(
      DRAG_DROP_PASTE, (files) => {
        const imageFile = getFirstImageFile(files);
        if (!imageFile) return false;
        insertImageFile(imageFile).catch(() => undefined);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND, (event) => {
        const [, files] = eventFiles(event);
        const imageFile = getFirstImageFile(files);
        if (!imageFile) return false;
        event.preventDefault();
        editor.dispatchCommand(DRAG_DROP_PASTE, [imageFile]);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      DROP_COMMAND, (event) => {
        const [, files] = eventFiles(event);
        const imageFile = getFirstImageFile(files);
        if (!imageFile) return false;
        event.preventDefault();
        editor.dispatchCommand(DRAG_DROP_PASTE, [imageFile]);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}`}
      </CodeBlock>

      <SectionHeading id="component">component.tsx</SectionHeading>
      <Paragraph>
        The React component rendered by <code>ImageNode.decorate()</code>.
        Handles click-to-select, Backspace/Delete to remove, and{" "}
        <code>FORMAT_ELEMENT_COMMAND</code> to change alignment. Mounts{" "}
        <code>ImageResizer</code> when the node is selected.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/image/component.tsx">
        {`import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey, $getSelection, $isNodeSelection,
  CLICK_COMMAND, COMMAND_PRIORITY_LOW, DRAGSTART_COMMAND,
  FORMAT_ELEMENT_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND,
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
  alignment, altText, height, nodeKey, src, width,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const effectiveWidth = width === "inherit" ? DEFAULT_IMAGE_WIDTH : width;

  const isInNodeSelection = useMemo(() => {
    if (!isSelected) return false;
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
    if (!editable) return;

    const removeSelectedImage = (event: KeyboardEvent) => {
      const selection = $getSelection();
      if (!(isSelected && $isNodeSelection(selection))) return false;
      event.preventDefault();
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) node.remove();
      });
      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND, (event) => {
          if (isResizing) return true;
          if (event.target !== imageRef.current) return false;
          if (event.shiftKey) { setSelected(!isSelected); }
          else { clearSelection(); setSelected(true); }
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND, (event) => {
          if (event.target === imageRef.current) { event.preventDefault(); return true; }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        FORMAT_ELEMENT_COMMAND, (format) => {
          if (!isSelected) return false;
          if (!(format === "left" || format === "center" || format === "right")) return false;
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) node.setAlignment(format as ImageAlignment);
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, removeSelectedImage, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DELETE_COMMAND, removeSelectedImage, COMMAND_PRIORITY_LOW)
    );
  }, [clearSelection, editable, editor, isResizing, isSelected, nodeKey, setSelected]);

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
          <div className={
            isFocused
              ? "rounded-2xl ring-2 ring-primary/60 ring-offset-2 ring-offset-background"
              : "rounded-2xl"
          }>
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
                window.setTimeout(() => { setIsResizing(false); }, 200);
                editor.update(() => {
                  const node = $getNodeByKey(nodeKey);
                  if ($isImageNode(node)) node.setWidthAndHeight(nextWidth, nextHeight);
                });
              }}
              onResizeStart={() => { setIsResizing(true); }}
            />
          ) : null}
        </div>
      </div>
    </figure>
  );
}`}
      </CodeBlock>

      <SectionHeading id="resizer">resizer.tsx</SectionHeading>
      <Paragraph>
        Renders four corner drag handles (<code>ne</code>, <code>se</code>,{" "}
        <code>sw</code>, <code>nw</code>) as absolute-positioned divs. Uses
        pointer events to track drag distance and update the image's inline
        style in real-time, then calls <code>onResizeEnd</code> with the final
        pixel dimensions.
      </Paragraph>
      <CodeBlock language="src/components/editor/plugins/image/resizer.tsx">
        {`import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import { useRef } from "react";

type ResizeDirection = "ne" | "nw" | "se" | "sw";

interface ImageResizerProps {
  editor: LexicalEditor;
  imageRef: { current: HTMLImageElement | null };
  maxWidth?: number;
  onResizeEnd: (width: number, height: number) => void;
  onResizeStart: () => void;
}

interface ResizeState {
  currentHeight: number;
  currentWidth: number;
  direction: ResizeDirection;
  isResizing: boolean;
  ratio: number;
  startHeight: number;
  startWidth: number;
  startX: number;
  startY: number;
}

const CORNER_DIRECTIONS: ResizeDirection[] = ["ne", "se", "sw", "nw"];

const CORNER_CLASSES: Record<ResizeDirection, string> = {
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize border-t-2 border-r-2",
  se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize border-b-2 border-r-2",
  sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize border-b-2 border-l-2",
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize border-t-2 border-l-2",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isEast = (d: ResizeDirection) => d === "ne" || d === "se";
const getCursor = (d: ResizeDirection) =>
  d === "nw" || d === "se" ? "nwse-resize" : "nesw-resize";

export function ImageResizer({
  editor, imageRef, maxWidth, onResizeEnd, onResizeStart,
}: ImageResizerProps) {
  const controlWrapperRef = useRef<HTMLDivElement | null>(null);
  const userSelect = useRef({ priority: "", value: "default" });
  const positioningRef = useRef<ResizeState>({
    currentHeight: 0, currentWidth: 0, direction: "se",
    isResizing: false, ratio: 0,
    startHeight: 0, startWidth: 0, startX: 0, startY: 0,
  });

  const editorRootElement = editor.getRootElement();
  let maxWidthContainer = 100;
  if (maxWidth) {
    maxWidthContainer = maxWidth;
  } else if (editorRootElement) {
    maxWidthContainer = editorRootElement.getBoundingClientRect().width - 20;
  }

  const setStartCursor = (direction: ResizeDirection) => {
    const cursor = getCursor(direction);
    editorRootElement?.style.setProperty("cursor", cursor, "important");
    document.body.style.setProperty("cursor", cursor, "important");
    userSelect.current.value = document.body.style.getPropertyValue("-webkit-user-select");
    userSelect.current.priority = document.body.style.getPropertyPriority("-webkit-user-select");
    document.body.style.setProperty("-webkit-user-select", "none", "important");
  };

  const setEndCursor = () => {
    editorRootElement?.style.setProperty("cursor", "text");
    document.body.style.setProperty("cursor", "default");
    document.body.style.setProperty(
      "-webkit-user-select",
      userSelect.current.value,
      userSelect.current.priority
    );
  };

  const handlePointerMove = (event: PointerEvent) => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    if (!(image && positioning.isResizing)) return;
    const zoom = calculateZoomLevel(image);
    let diff = Math.floor(positioning.startX - event.clientX / zoom);
    diff = isEast(positioning.direction) ? -diff : diff;
    const width = clamp(positioning.startWidth + diff, 100, maxWidthContainer);
    const height = width / positioning.ratio;
    image.style.width = \`\${width}px\`;
    image.style.height = \`\${height}px\`;
    positioning.currentHeight = height;
    positioning.currentWidth = width;
  };

  const handlePointerUp = () => {
    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;
    const positioning = positioningRef.current;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    setEndCursor();
    if (!(image && controlWrapper && positioning.isResizing)) return;
    const width = positioning.currentWidth;
    const height = positioning.currentHeight;
    positioning.startWidth = 0; positioning.startHeight = 0; positioning.ratio = 0;
    positioning.startX = 0; positioning.startY = 0;
    positioning.currentWidth = 0; positioning.currentHeight = 0;
    positioning.isResizing = false;
    controlWrapper.classList.remove("image-control-wrapper--resizing");
    onResizeEnd(width, height);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    if (!editor.isEditable()) return;
    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (!(image && controlWrapper)) return;
    event.preventDefault();
    const { height, width } = image.getBoundingClientRect();
    const zoom = calculateZoomLevel(image);
    const positioning = positioningRef.current;
    positioning.startWidth = width; positioning.startHeight = height;
    positioning.ratio = width / height;
    positioning.currentWidth = width; positioning.currentHeight = height;
    positioning.startX = event.clientX / zoom; positioning.startY = event.clientY / zoom;
    positioning.isResizing = true; positioning.direction = direction;
    setStartCursor(direction);
    onResizeStart();
    controlWrapper.classList.add("image-control-wrapper--resizing");
    image.style.height = \`\${height}px\`; image.style.width = \`\${width}px\`;
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      className="absolute inset-0 [&.image-control-wrapper--resizing]:touch-none"
      ref={controlWrapperRef}
    >
      {CORNER_DIRECTIONS.map((direction) => (
        <div
          className={\`absolute size-2.5 rounded-full bg-primary/70 \${CORNER_CLASSES[direction]}\`}
          key={direction}
          onPointerDown={(event) => handlePointerDown(event, direction)}
        />
      ))}
    </div>
  );
}`}
      </CodeBlock>

      <SectionHeading id="registration">Registration</SectionHeading>
      <Paragraph>
        Register <code>ImageNode</code> in your Lexical config and mount{" "}
        <code>ImagePlugin</code> inside your composer:
      </Paragraph>
      <CodeBlock language="tsx">
        {`// core/config.ts — add to the nodes array
import { ImageNode } from "./nodes/image/node";
nodes: [..., ImageNode]

// ui/content.tsx — mount the plugin
import { ImagePlugin } from "../plugins/image/plugin";
<ImagePlugin />`}
      </CodeBlock>

      <SubHeading>Inserting an image programmatically</SubHeading>
      <CodeBlock language="tsx">
        {`editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
  src: "https://example.com/photo.jpg",
  altText: "A photo",
  alignment: "center",
});`}
      </CodeBlock>

      <Callout title="File paste / drop is automatic" variant="tip">
        <code>ImagePlugin</code> intercepts <code>PASTE_COMMAND</code> and{" "}
        <code>DROP_COMMAND</code> automatically. Any image file dragged into the
        editor or pasted from the clipboard is converted to a data URL and
        inserted as an <code>ImageNode</code>.
      </Callout>
    </>
  );
}
