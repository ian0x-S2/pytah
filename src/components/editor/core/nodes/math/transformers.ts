import type {
  MultilineElementTransformer,
  TextMatchTransformer,
} from "@lexical/markdown";
import { $createMathNode, $isMathNode, MathNode } from "./node";

export const MATH_INLINE_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MathNode],
  export: (node) => {
    if (!($isMathNode(node) && node.getInline())) {
      return null;
    }
    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+)\$/,
  regExp: /\$([^$]+)\$/,
  replace: (node, match) => {
    const [, equation] = match;
    if (!equation) {
      return;
    }
    node.replace($createMathNode({ equation, inline: true }));
  },
  trigger: "$",
  type: "text-match",
};

export const MATH_BLOCK_MARKDOWN_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [MathNode],
  export: (node) => {
    if (!$isMathNode(node) || node.getInline()) {
      return null;
    }
    return `$$\n${node.getEquation()}\n$$`;
  },
  handleImportAfterStartMatch: ({ lines, rootNode, startLineIndex }) => {
    const startLine = lines[startLineIndex];
    if (!startLine) {
      return null;
    }

    if (
      startLine.startsWith("$$") &&
      startLine.endsWith("$$") &&
      startLine.length > 4
    ) {
      const equation = startLine.slice(2, -2).trim();
      rootNode.append($createMathNode({ equation, inline: false }));
      return [true, startLineIndex];
    }

    if (startLine.trim() !== "$$") {
      return null;
    }

    const equationLines: string[] = [];
    let lineIndex = startLineIndex + 1;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex] ?? "";
      if (line.trim() === "$$") {
        break;
      }
      equationLines.push(line);
      lineIndex += 1;
    }

    const equation = equationLines.join("\n").trim();
    rootNode.append($createMathNode({ equation, inline: false }));
    return [true, lineIndex];
  },
  regExpEnd: {
    optional: true,
    regExp: /^\$\$\s*$/,
  },
  regExpStart: /^\$\$\s*$/,
  replace: () => false,
  type: "multiline-element",
};
