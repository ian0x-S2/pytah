import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/extension";
import type { TextMatchTransformer } from "@lexical/markdown";
import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  type ElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
  type MultilineElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import {
  $createParagraphNode,
  $createTextNode,
  $isParagraphNode,
  type ElementNode,
} from "lexical";
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from "../../core/nodes/image/node";
import {
  $createMathNode,
  $isMathNode,
  MathNode,
} from "../../core/nodes/math/node";
import {
  $createYouTubeNode,
  $isYouTubeNode,
  YouTubeNode,
} from "../../core/nodes/youtube/node";
import { parseYouTubeUrl } from "../youtube/utils";

const IMAGE_REGEXP = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const YOUTUBE_URL_REGEXP = /^https?:\/\/\S+$/;
const TABLE_DIVIDER_LINE_PATTERN = /^\|(?:\s*:?-+:?\s*\|)+\s*$/;
const TABLE_ROW_PATTERN = /^\|(.+)\|\s*$/;

const MATH_INLINE_TRANSFORMER: TextMatchTransformer = {
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

const MATH_BLOCK_TRANSFORMER: MultilineElementTransformer = {
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

const IMAGE_TRANSFORMER: ElementTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText().replace(/]/g, "\\]")}](${node.getSrc()})`;
  },
  regExp: IMAGE_REGEXP,
  replace: (parentNode, _children, match) => {
    const [, altText, src] = match;
    parentNode.replace(
      $createImageNode({
        altText,
        src,
      })
    );
  },
  type: "element",
};

const YOUTUBE_TRANSFORMER: ElementTransformer = {
  dependencies: [YouTubeNode],
  export: (node) => {
    if (!$isYouTubeNode(node)) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${node.getVideoId()}`;
  },
  regExp: YOUTUBE_URL_REGEXP,
  replace: (parentNode, _children, match) => {
    const videoId = parseYouTubeUrl(match[0]);
    if (!videoId) {
      return;
    }

    parentNode.replace($createYouTubeNode(videoId));
  },
  type: "element",
};

const splitMarkdownTableCells = (line: string): string[] => {
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
};

const createTableCell = (
  textContent: string,
  isHeader: boolean
): TableCellNode => {
  const tableCell = $createTableCellNode(isHeader ? 1 : 0);
  const paragraph = $createParagraphNode();

  paragraph.append($createTextNode(textContent));
  tableCell.append(paragraph);

  return tableCell;
};

const TABLE_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (node) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const rows = node.getChildren().filter((child): child is TableRowNode => {
      return child instanceof TableRowNode;
    });

    if (rows.length === 0) {
      return null;
    }

    const markdownRows = rows.map((row) => {
      const cells = row
        .getChildren()
        .filter((child): child is TableCellNode => {
          return child instanceof TableCellNode;
        });

      const cellContents = cells.map((cell) => {
        return cell.getTextContent().replace(/\|/g, "\\|").trim();
      });

      return `| ${cellContents.join(" | ")} |`;
    });

    const headerCells = rows[0]
      .getChildren()
      .filter(
        (child): child is TableCellNode => child instanceof TableCellNode
      );

    const dividerRow = `| ${headerCells.map(() => "---").join(" | ")} |`;

    return [markdownRows[0], dividerRow, ...markdownRows.slice(1)].join("\n");
  },
  handleImportAfterStartMatch: ({ lines, rootNode, startLineIndex }) => {
    const headerLine = lines[startLineIndex];
    const dividerLine = lines[startLineIndex + 1];

    if (
      !(
        headerLine &&
        dividerLine &&
        TABLE_ROW_PATTERN.test(headerLine) &&
        TABLE_DIVIDER_LINE_PATTERN.test(dividerLine)
      )
    ) {
      return null;
    }

    const headerCells = splitMarkdownTableCells(headerLine);
    const dividerCells = splitMarkdownTableCells(dividerLine);

    if (
      headerCells.length === 0 ||
      headerCells.length !== dividerCells.length
    ) {
      return null;
    }

    const bodyLines: string[] = [];
    let lineIndex = startLineIndex + 2;

    while (
      lineIndex < lines.length &&
      TABLE_ROW_PATTERN.test(lines[lineIndex] ?? "")
    ) {
      bodyLines.push(lines[lineIndex] as string);
      lineIndex += 1;
    }

    const tableNode = $createTableNode();
    const headerRow = $createTableRowNode();

    for (const cellText of headerCells) {
      headerRow.append(createTableCell(cellText, true));
    }

    tableNode.append(headerRow);

    for (const bodyLine of bodyLines) {
      const bodyCells = splitMarkdownTableCells(bodyLine);
      const rowNode = $createTableRowNode();

      for (let cellIndex = 0; cellIndex < headerCells.length; cellIndex += 1) {
        rowNode.append(createTableCell(bodyCells[cellIndex] ?? "", false));
      }

      tableNode.append(rowNode);
    }

    rootNode.append(tableNode);
    return [true, lineIndex - 1];
  },
  regExpEnd: {
    optional: true,
    regExp: /^$/,
  },
  regExpStart: TABLE_ROW_PATTERN,
  replace: () => false,
  type: "multiline-element",
};

const HORIZONTAL_RULE_REGEXP = /^---\s?$/;

/**
 * Replaces a paragraph with a horizontal rule node. When `trailingParagraph`
 * is true the caret is repositioned into the following editable paragraph,
 * creating one when the rule is the last top-level node, so the cursor stays
 * usable after a `---` shortcut.
 */
export const $replaceWithHorizontalRule = (
  parentNode: ElementNode,
  trailingParagraph: boolean
): HorizontalRuleNode => {
  const rule = $createHorizontalRuleNode();
  parentNode.replace(rule);

  if (trailingParagraph) {
    const nextSibling = rule.getNextSibling();
    if (nextSibling !== null && $isParagraphNode(nextSibling)) {
      nextSibling.selectStart();
    } else {
      const paragraph = $createParagraphNode();
      rule.insertAfter(paragraph);
      paragraph.selectStart();
    }
  }

  return rule;
};

const HORIZONTAL_RULE_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    if (!$isHorizontalRuleNode(node)) {
      return null;
    }

    return "---";
  },
  regExp: HORIZONTAL_RULE_REGEXP,
  replace: (parentNode, _children, _match, isImport) => {
    $replaceWithHorizontalRule(parentNode, !isImport);
  },
  type: "element",
};

export const TABLE_MARKDOWN_TRANSFORMER = TABLE_TRANSFORMER;
export const MATH_BLOCK_MARKDOWN_TRANSFORMER = MATH_BLOCK_TRANSFORMER;
export const MATH_INLINE_MARKDOWN_TRANSFORMER = MATH_INLINE_TRANSFORMER;
export const IMAGE_MARKDOWN_TRANSFORMER = IMAGE_TRANSFORMER;
export const YOUTUBE_MARKDOWN_TRANSFORMER = YOUTUBE_TRANSFORMER;
export const HORIZONTAL_RULE_MARKDOWN_TRANSFORMER = HORIZONTAL_RULE_TRANSFORMER;

export const BUILTIN_MARKDOWN_TRANSFORMERS = [
  CHECK_LIST,
  HORIZONTAL_RULE_TRANSFORMER,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
] as const;

export const EDITOR_MARKDOWN_TRANSFORMERS = [
  TABLE_MARKDOWN_TRANSFORMER,
  MATH_BLOCK_MARKDOWN_TRANSFORMER,
  ...BUILTIN_MARKDOWN_TRANSFORMERS,
  MATH_INLINE_MARKDOWN_TRANSFORMER,
  IMAGE_MARKDOWN_TRANSFORMER,
  YOUTUBE_MARKDOWN_TRANSFORMER,
];
