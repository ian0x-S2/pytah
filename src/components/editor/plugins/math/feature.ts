import { $createParagraphNode, type ElementNode } from "lexical";
import { CalculatorIcon } from "lucide-react";
import { $createMathNode, MathNode } from "../../core/nodes/math/node";
import {
  MATH_BLOCK_MARKDOWN_TRANSFORMER,
  MATH_INLINE_MARKDOWN_TRANSFORMER,
} from "../../core/nodes/math/transformers";
import type { ExtraEditorFeature } from "../../core/types";
import { replaceCurrentBlock } from "../slash-command/utils";
import { MathPlugin } from "./plugin";

const applyMathCommand = (targetElement: ElementNode): void => {
  const mathNode = $createMathNode({
    equation: "f(x) = c",
    inline: false,
  });
  const paragraph = $createParagraphNode();

  targetElement.replace(mathNode);
  mathNode.insertAfter(paragraph);
  paragraph.select();
};

/**
 * Installs the math feature: the `MathNode`, KaTeX rendering, the `$...$` /
 * `$$...$$` markdown transformers and the shared insert-menu entry. Ships as
 * the `editor-math` registry item and pulls `katex`.
 */
export const mathFeature: ExtraEditorFeature = {
  id: "math",
  nodes: [MathNode],
  plugin: MathPlugin,
  slashCommands: [
    {
      command: {
        description: "Insert TeX math equation",
        icon: CalculatorIcon,
        id: "math",
        keywords: ["math", "latex", "katex", "equation", "formula", "tex"],
        label: "Math Block",
      },
      run: (editor) => {
        replaceCurrentBlock(editor, applyMathCommand);
      },
    },
  ],
  transformers: [
    MATH_INLINE_MARKDOWN_TRANSFORMER,
    MATH_BLOCK_MARKDOWN_TRANSFORMER,
  ],
};
