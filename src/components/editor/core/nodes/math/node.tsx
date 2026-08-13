"use client";

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
import { MathComponent } from "../../../plugins/math/component";

export type SerializedMathNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

export interface MathPayload {
  equation: string;
  inline?: boolean;
  key?: NodeKey;
}

const convertMathElement = (domNode: Node): DOMConversionOutput | null => {
  if (!(domNode instanceof HTMLElement)) {
    return null;
  }

  const equation = domNode.getAttribute("data-equation");
  if (equation === null) {
    return null;
  }

  const inline = domNode.getAttribute("data-inline") !== "false";

  return {
    node: $createMathNode({
      equation,
      inline,
    }),
  };
};

export class MathNode extends DecoratorNode<JSX.Element> {
  __equation: string;
  __inline: boolean;

  constructor(equation: string, inline = true, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  static getType(): string {
    return "math";
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__equation, node.__inline, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: Node) => {
        if (
          domNode instanceof HTMLElement &&
          domNode.hasAttribute("data-equation")
        ) {
          return {
            conversion: convertMathElement,
            priority: 2,
          };
        }
        return null;
      },
      span: (domNode: Node) => {
        if (
          domNode instanceof HTMLElement &&
          domNode.hasAttribute("data-equation")
        ) {
          return {
            conversion: convertMathElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    return $createMathNode({
      equation: serializedNode.equation,
      inline: serializedNode.inline,
    }).updateFromJSON(serializedNode);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedMathNode>): this {
    return super
      .updateFromJSON(serializedNode)
      .setEquation(serializedNode.equation)
      .setInline(serializedNode.inline);
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.__inline ? "span" : "div");
    element.setAttribute("data-lexical-math", "true");
    element.setAttribute("data-equation", this.__equation);
    element.setAttribute("data-inline", this.__inline ? "true" : "false");
    element.textContent = this.__equation;
    return { element };
  }

  exportJSON(): SerializedMathNode {
    return {
      ...super.exportJSON(),
      equation: this.__equation,
      inline: this.__inline,
      type: "math",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement(this.__inline ? "span" : "div");

    if (typeof config.theme.math === "string") {
      addClassNamesToElement(element, config.theme.math);
    }

    if (this.__inline) {
      element.className = "inline-block cursor-pointer select-none";
    } else {
      element.className = "block my-2 cursor-pointer select-none text-center";
    }

    return element;
  }

  updateDOM(prevNode: MathNode): boolean {
    return this.__inline !== prevNode.__inline;
  }

  getTextContent(): string {
    return this.__equation;
  }

  decorate(): JSX.Element {
    return (
      <MathComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.getKey()}
      />
    );
  }

  isInline(): boolean {
    return this.__inline;
  }

  getEquation(): string {
    return this.getLatest().__equation;
  }

  setEquation(equation: string): this {
    const writable = this.getWritable();
    writable.__equation = equation;
    return writable;
  }

  getInline(): boolean {
    return this.getLatest().__inline;
  }

  setInline(inline: boolean): this {
    const writable = this.getWritable();
    writable.__inline = inline;
    return writable;
  }
}

export function $createMathNode({
  equation,
  inline = true,
  key,
}: MathPayload): MathNode {
  return new MathNode(equation, inline, key);
}

export function $isMathNode(
  node: LexicalNode | null | undefined
): node is MathNode {
  return node instanceof MathNode;
}
