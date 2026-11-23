import type {
  MultilineElementTransformer,
  TextMatchTransformer,
} from "@lexical/markdown";

import { $createMathNode, $isMathNode, MathNode } from "./node";

// Requires non-whitespace directly inside both delimiters and rejects a digit
// right after the closing `$`, preventing currency strings like "$5 and $10"
// from being parsed as inline math while preserving "$x$" and "$E = mc^2$".
const INLINE_MATH_REGEXP = /\$(?<equation>[^\s$](?:[^$]*[^\s$])?)\$(?!\d)/u;

export const MATH_INLINE_MARKDOWN_TRANSFORMER: TextMatchTransformer = {
  dependencies: [MathNode],
  export: (node) => {
    if (!($isMathNode(node) && node.getInline())) {
      return null;
    }
    return `$${node.getEquation()}$`;
  },
  importRegExp: INLINE_MATH_REGEXP,
  regExp: INLINE_MATH_REGEXP,
  replace: (node, match) => {
    const equation = match.groups?.equation;
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
    const startLine = lines[startLineIndex]?.trim();
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

    if (startLine !== "$$") {
      return null;
    }

    const equationLines: string[] = [];
    let lineIndex = startLineIndex + 1;
    let foundClosing = false;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex] ?? "";
      if (line.trim() === "$$") {
        foundClosing = true;
        break;
      }
      equationLines.push(line);
      lineIndex += 1;
    }

    if (!foundClosing) {
      return null;
    }

    const equation = equationLines.join("\n").trim();
    rootNode.append($createMathNode({ equation, inline: false }));
    return [true, lineIndex];
  },
  regExpEnd: {
    optional: true,
    regExp: /^\$\$\s*$/u,
  },
  regExpStart: /^\$\$/u,
  replace: () => false,
  type: "multiline-element",
};
