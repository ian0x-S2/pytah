"use client";

import { addClassNamesToElement } from "@lexical/utils";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { DecoratorNode } from "lexical";
import type { JSX } from "react";
import { ExcalidrawComponent } from "../../../plugins/excalidraw/component";

export type ExcalidrawDimension = number | "inherit";

export type SerializedExcalidrawNode = Spread<
  {
    data: string;
    height?: ExcalidrawDimension;
    width?: ExcalidrawDimension;
  },
  SerializedLexicalNode
>;

/** Attribute used for HTML round-trips of excalidraw scenes. */
export const EXCALIDRAW_DATA_ATTRIBUTE = "data-lexical-excalidraw-json";

const convertExcalidrawElement = (
  domNode: HTMLElement
): DOMConversionOutput | null => {
  const data = domNode.getAttribute(EXCALIDRAW_DATA_ATTRIBUTE);
  if (!data) {
    return null;
  }

  return {
    node: $createExcalidrawNode({ data }),
  };
};

export interface ExcalidrawNodePayload {
  data?: string;
  height?: ExcalidrawDimension;
  key?: NodeKey;
  width?: ExcalidrawDimension;
}

/**
 * Block-level decorator node that stores an excalidraw scene as serialized
 * JSON. The rendered drawing is embedded into `exportDOM` alongside the raw
 * data attribute so pasted HTML stays visible outside the editor and can be
 * re-imported as an editable drawing.
 */
export class ExcalidrawNode extends DecoratorNode<JSX.Element> {
  __data: string;
  __height: ExcalidrawDimension;
  __width: ExcalidrawDimension;

  constructor(
    data = "[]",
    width: ExcalidrawDimension = "inherit",
    height: ExcalidrawDimension = "inherit",
    key?: NodeKey
  ) {
    super(key);
    this.__data = data;
    this.__width = width;
    this.__height = height;
  }

  static getType(): string {
    return "excalidraw";
  }

  static clone(node: ExcalidrawNode): ExcalidrawNode {
    return new ExcalidrawNode(
      node.__data,
      node.__width,
      node.__height,
      node.__key
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute(EXCALIDRAW_DATA_ATTRIBUTE)) {
          return null;
        }

        return {
          conversion: convertExcalidrawElement,
          priority: 1,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedExcalidrawNode): ExcalidrawNode {
    return $createExcalidrawNode({
      data: serializedNode.data,
      height: serializedNode.height,
      width: serializedNode.width,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedExcalidrawNode>
  ): this {
    return super
      .updateFromJSON(serializedNode)
      .setData(serializedNode.data ?? "[]")
      .setHeight(serializedNode.height ?? "inherit")
      .setWidth(serializedNode.width ?? "inherit");
  }

  exportJSON(): SerializedExcalidrawNode {
    return {
      ...super.exportJSON(),
      data: this.__data,
      height: this.__height === "inherit" ? undefined : this.__height,
      type: "excalidraw",
      version: 1,
      width: this.__width === "inherit" ? undefined : this.__width,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("span");
    element.style.display = "block";

    // Embed the currently rendered svg so exported/pasted HTML shows the
    // drawing even where excalidraw is unavailable.
    const content = editor.getElementByKey(this.getKey());
    const svg = content?.querySelector("svg");
    if (svg) {
      element.append(svg.cloneNode(true));
    }

    if (this.__width !== "inherit") {
      element.style.width = `${this.__width}px`;
    }

    if (this.__height !== "inherit") {
      element.style.height = `${this.__height}px`;
    }

    element.setAttribute(EXCALIDRAW_DATA_ATTRIBUTE, this.__data);
    return { element };
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
      <ExcalidrawComponent
        data={this.__data}
        height={this.__height}
        nodeKey={this.getKey()}
        width={this.__width}
      />
    );
  }

  isInline(): false {
    return false;
  }

  getData(): string {
    return this.getLatest().__data;
  }

  getWidth(): ExcalidrawDimension {
    return this.getLatest().__width;
  }

  getHeight(): ExcalidrawDimension {
    return this.getLatest().__height;
  }

  setData(data: string): this {
    const writable = this.getWritable();
    writable.__data = data;
    return writable;
  }

  setWidth(width: ExcalidrawDimension): this {
    const writable = this.getWritable();
    writable.__width = width;
    return writable;
  }

  setHeight(height: ExcalidrawDimension): this {
    const writable = this.getWritable();
    writable.__height = height;
    return writable;
  }
}

export function $createExcalidrawNode({
  data,
  height,
  key,
  width,
}: ExcalidrawNodePayload = {}): ExcalidrawNode {
  return new ExcalidrawNode(data, width, height, key);
}

export function $isExcalidrawNode(
  node: LexicalNode | null | undefined
): node is ExcalidrawNode {
  return node instanceof ExcalidrawNode;
}
