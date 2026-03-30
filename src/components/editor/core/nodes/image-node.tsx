import { addClassNamesToElement } from "@lexical/utils";
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
import { ImageComponent } from "../../plugins/image/component";

export type SerializedImageNode = Spread<
  {
    altText: string;
    height: number | "inherit";
    src: string;
    width: number | "inherit";
  },
  SerializedLexicalNode
>;

export interface ImagePayload {
  altText: string;
  height?: number | "inherit";
  key?: NodeKey;
  src: string;
  width?: number | "inherit";
}

const convertImageElement = (domNode: Node): DOMConversionOutput | null => {
  if (!(domNode instanceof HTMLImageElement)) {
    return null;
  }

  const src = domNode.getAttribute("src");
  if (!src || src.startsWith("file:///")) {
    return null;
  }

  return {
    node: $createImageNode({
      altText: domNode.getAttribute("alt") ?? "",
      height: domNode.height || undefined,
      src,
      width: domNode.width || undefined,
    }),
  };
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __altText: string;
  __height: number | "inherit";
  __src: string;
  __width: number | "inherit";

  constructor(
    src: string,
    altText: string,
    width: number | "inherit" = "inherit",
    height: number | "inherit" = "inherit",
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 2,
      }),
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      altText: serializedNode.altText,
      height: serializedNode.height,
      src: serializedNode.src,
      width: serializedNode.width,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this {
    return super
      .updateFromJSON(serializedNode)
      .setAltText(serializedNode.altText)
      .setHeight(serializedNode.height)
      .setSrc(serializedNode.src)
      .setWidth(serializedNode.width);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);

    if (this.__width !== "inherit") {
      element.width = this.__width;
    }

    if (this.__height !== "inherit") {
      element.height = this.__height;
    }

    return { element };
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
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

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        altText={this.__altText}
        height={this.__height}
        nodeKey={this.getKey()}
        src={this.__src}
        width={this.__width}
      />
    );
  }

  isInline(): false {
    return false;
  }

  getSrc(): string {
    return this.getLatest().__src;
  }

  getAltText(): string {
    return this.getLatest().__altText;
  }

  getWidth(): number | "inherit" {
    return this.getLatest().__width;
  }

  getHeight(): number | "inherit" {
    return this.getLatest().__height;
  }

  setAltText(altText: string): this {
    const writable = this.getWritable();
    writable.__altText = altText;
    return writable;
  }

  setWidth(width: number | "inherit"): this {
    const writable = this.getWritable();
    writable.__width = width;
    return writable;
  }

  setWidthAndHeight(
    width: number | "inherit",
    height: number | "inherit"
  ): this {
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
  altText,
  height,
  key,
  src,
  width,
}: ImagePayload): ImageNode {
  return new ImageNode(
    src,
    altText,
    width ?? "inherit",
    height ?? "inherit",
    key
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
