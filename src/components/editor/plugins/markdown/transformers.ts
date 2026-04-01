import {
  CHECK_LIST,
  type ElementTransformer,
  type MultilineElementTransformer,
  TRANSFORMERS,
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
import { $createParagraphNode, $createTextNode } from "lexical";
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from "../../core/nodes/image/node";
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

export const EDITOR_MARKDOWN_TRANSFORMERS = [
  ...TRANSFORMERS.filter((transformer) => transformer !== CHECK_LIST),
  CHECK_LIST,
  IMAGE_TRANSFORMER,
  YOUTUBE_TRANSFORMER,
  TABLE_TRANSFORMER,
];
