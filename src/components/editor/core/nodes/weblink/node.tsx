"use client";

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
} from "lexical";
import { DecoratorNode } from "lexical";
import type { JSX } from "react";

import { WeblinkComponent } from "./component";
import type {
  SerializedWeblinkNode,
  WeblinkFormat,
  WeblinkPayload,
} from "./types";
import { resolveWeblinkMetadata } from "./utils";

export type {
  SerializedWeblinkNode,
  WeblinkFormat,
  WeblinkMetadata,
  WeblinkMetadataFetcher,
  WeblinkPayload,
} from "./types";

export { resolveWeblinkMetadata } from "./utils";

const convertWeblinkElement = (domNode: Node): DOMConversionOutput | null => {
  if (!(domNode instanceof HTMLElement)) {
    return null;
  }

  const { description, format, icon, image, title, url } = domNode.dataset;
  if (!url) {
    return null;
  }

  const resolvedFormat: WeblinkFormat =
    format === "small" || format === "wide" ? format : "inline";

  return {
    node: $createWeblinkNode({
      description,
      format: resolvedFormat,
      icon,
      image,
      title,
      url,
    }),
  };
};

export class WeblinkNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __title: string;
  __description?: string;
  __icon?: string;
  __image?: string;
  __format: WeblinkFormat;

  constructor(payload: WeblinkPayload, key?: NodeKey) {
    super(key);
    this.__url = payload.url;
    const defaultMeta = resolveWeblinkMetadata(payload.url);
    this.__title = payload.title ?? defaultMeta.title;
    this.__description = payload.description;
    this.__icon = payload.icon ?? defaultMeta.icon;
    this.__image = payload.image;
    this.__format = payload.format ?? "inline";
  }

  static override getType(): string {
    return "weblink";
  }

  static override clone(node: WeblinkNode): WeblinkNode {
    return new WeblinkNode(
      {
        description: node.__description,
        format: node.__format,
        icon: node.__icon,
        image: node.__image,
        title: node.__title,
        url: node.__url,
      },
      node.__key
    );
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      a: (domNode: Node) => {
        if (
          domNode instanceof HTMLElement &&
          domNode.dataset.lexicalWeblink === "true"
        ) {
          return {
            conversion: convertWeblinkElement,
            priority: 2,
          };
        }
        return null;
      },
      figure: (domNode: Node) => {
        if (
          domNode instanceof HTMLElement &&
          domNode.dataset.lexicalWeblink === "true"
        ) {
          return {
            conversion: convertWeblinkElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  static override importJSON(
    serializedNode: SerializedWeblinkNode
  ): WeblinkNode {
    return $createWeblinkNode({
      description: serializedNode.description,
      format: serializedNode.format,
      icon: serializedNode.icon,
      image: serializedNode.image,
      title: serializedNode.title,
      url: serializedNode.url,
    }).updateFromJSON(serializedNode);
  }

  override updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedWeblinkNode>
  ): this {
    const writable = this.getWritable();
    writable.__url = serializedNode.url;
    writable.__title = serializedNode.title;
    writable.__description = serializedNode.description;
    writable.__icon = serializedNode.icon;
    writable.__image = serializedNode.image;
    writable.__format = serializedNode.format;
    return super.updateFromJSON(serializedNode);
  }

  override exportDOM(): DOMExportOutput {
    const isInline = this.__format === "inline";
    const element = document.createElement(isInline ? "a" : "figure");
    element.dataset.lexicalWeblink = "true";
    element.dataset.url = this.__url;
    element.dataset.title = this.__title;
    element.dataset.format = this.__format;
    if (this.__description) {
      element.dataset.description = this.__description;
    }
    if (this.__icon) {
      element.dataset.icon = this.__icon;
    }
    if (this.__image) {
      element.dataset.image = this.__image;
    }

    if (isInline) {
      (element as HTMLAnchorElement).href = this.__url;
      element.textContent = this.__title || this.__url;
    } else {
      const link = document.createElement("a");
      link.href = this.__url;
      link.textContent = this.__title || this.__url;
      element.append(link);
    }

    return { element };
  }

  override exportJSON(): SerializedWeblinkNode {
    return {
      ...super.exportJSON(),
      description: this.__description,
      format: this.__format,
      icon: this.__icon,
      image: this.__image,
      title: this.__title,
      type: "weblink",
      url: this.__url,
      version: 1,
    };
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement(
      this.__format === "inline" ? "span" : "div"
    );
    element.dataset.weblinkWrapper = this.__format;
    element.className =
      this.__format === "inline" ? "inline-block align-baseline" : "block my-2";
    return element;
  }

  override updateDOM(prevNode: WeblinkNode): boolean {
    return this.__format !== prevNode.__format;
  }

  override isInline(): boolean {
    return this.__format === "inline";
  }

  override getTextContent(): string {
    return this.__title || this.__url;
  }

  override decorate(): JSX.Element {
    return (
      <WeblinkComponent
        description={this.__description}
        format={this.__format}
        icon={this.__icon}
        image={this.__image}
        nodeKey={this.getKey()}
        title={this.__title}
        url={this.__url}
      />
    );
  }

  getUrl(): string {
    return this.__url;
  }

  setUrl(url: string): this {
    const writable = this.getWritable();
    writable.__url = url;
    return writable;
  }

  getTitle(): string {
    return this.__title;
  }

  setTitle(title: string): this {
    const writable = this.getWritable();
    writable.__title = title;
    return writable;
  }

  getDescription(): string | undefined {
    return this.__description;
  }

  setDescription(description?: string): this {
    const writable = this.getWritable();
    writable.__description = description;
    return writable;
  }

  getIcon(): string | undefined {
    return this.__icon;
  }

  setIcon(icon?: string): this {
    const writable = this.getWritable();
    writable.__icon = icon;
    return writable;
  }

  getImage(): string | undefined {
    return this.__image;
  }

  setImage(image?: string): this {
    const writable = this.getWritable();
    writable.__image = image;
    return writable;
  }

  getFormat(): WeblinkFormat {
    return this.__format;
  }

  setFormat(format: WeblinkFormat): this {
    const writable = this.getWritable();
    writable.__format = format;
    return writable;
  }
}

export function $createWeblinkNode(payload: WeblinkPayload): WeblinkNode {
  return new WeblinkNode(payload);
}

export function $isWeblinkNode(
  node: LexicalNode | null | undefined
): node is WeblinkNode {
  return node instanceof WeblinkNode;
}
