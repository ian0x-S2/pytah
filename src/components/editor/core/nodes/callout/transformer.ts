import {
  $convertFromMarkdownString,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import type { MultilineElementTransformer } from "@lexical/markdown";
import {
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  ParagraphNode,
} from "lexical";
import type { LexicalNode } from "lexical";

import { $createCalloutNode, $isCalloutNode, CalloutNode } from "./node";
import type { CalloutType } from "./node";

const ALERT_START_REGEX =
  /^(?:>\s*)?\[!(?<type>NOTE|TIP|INFO|IMPORTANT|WARNING|CAUTION)\][ \t]?/iu;

const TYPE_MAP: Record<string, CalloutType> = {
  caution: "caution",
  important: "warning",
  info: "info",
  note: "note",
  tip: "tip",
  warning: "warning",
};

const INLINE_TRANSFORMERS = [
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

const appendNodesToCallout = (
  calloutNode: CalloutNode,
  children: readonly LexicalNode[]
) => {
  let inlineParagraph: ParagraphNode | null = null;

  for (const child of children) {
    if ($isElementNode(child) && !child.isInline()) {
      if (inlineParagraph) {
        calloutNode.append(inlineParagraph);
        inlineParagraph = null;
      }
      calloutNode.append(child);
    } else {
      if (!inlineParagraph) {
        inlineParagraph = $createParagraphNode();
      }
      inlineParagraph.append(child);
    }
  }

  if (inlineParagraph || calloutNode.getChildrenSize() === 0) {
    calloutNode.append(inlineParagraph ?? $createParagraphNode());
  }
};

export const CALLOUT_MARKDOWN_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [CalloutNode, ParagraphNode],
  export: (node, traverseChildren) => {
    if (!$isCalloutNode(node)) {
      return null;
    }
    const alertType = node.getCalloutType().toUpperCase();
    const blockChildren = node.getChildren();

    let childrenText = "";
    if (blockChildren.length > 0) {
      const blocks: string[] = [];
      for (const child of blockChildren) {
        if ($isElementNode(child)) {
          blocks.push(traverseChildren(child));
        } else {
          blocks.push(child.getTextContent());
        }
      }
      childrenText = blocks.join("\n\n").trim();
    } else {
      childrenText = traverseChildren(node).trim();
    }

    if (!childrenText) {
      return `> [!${alertType}]\n>`;
    }
    const lines = childrenText.split("\n");
    const formattedLines = lines.map((line) => (line ? `> ${line}` : ">"));
    return [`> [!${alertType}]`, ...formattedLines].join("\n");
  },
  handleImportAfterStartMatch: ({ lines, rootNode, startLineIndex }) => {
    const startLine = lines[startLineIndex];
    if (!startLine || !startLine.startsWith(">")) {
      return null;
    }
    const match = ALERT_START_REGEX.exec(startLine);
    if (!match?.groups?.type) {
      return null;
    }
    const rawType = match.groups.type.toLowerCase();
    const calloutType: CalloutType = TYPE_MAP[rawType] ?? "note";

    const contentLines: string[] = [];
    const inlineRemainder = startLine.slice(match[0].length).trim();
    if (inlineRemainder) {
      contentLines.push(inlineRemainder);
    }

    let lineIndex = startLineIndex + 1;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line === undefined || !line.startsWith(">")) {
        break;
      }
      contentLines.push(line.replace(/^>\s?/u, ""));
      lineIndex += 1;
    }

    const calloutNode = $createCalloutNode(calloutType);
    const bodyMarkdown = contentLines.join("\n").trim();

    if (bodyMarkdown.length === 0) {
      calloutNode.append($createParagraphNode());
    } else {
      try {
        $convertFromMarkdownString(
          bodyMarkdown,
          INLINE_TRANSFORMERS,
          calloutNode
        );
      } catch {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(bodyMarkdown));
        calloutNode.append(paragraph);
      }
      if (calloutNode.getChildrenSize() === 0) {
        calloutNode.append($createParagraphNode());
      }
    }

    rootNode.append(calloutNode);
    return [true, Math.max(startLineIndex, lineIndex - 1)];
  },
  regExpEnd: {
    optional: true,
    regExp: /^$/u,
  },
  regExpStart: ALERT_START_REGEX,
  replace: (
    rootNode,
    children,
    startMatch,
    _endMatch,
    linesInBetween,
    isImport
  ) => {
    const rawType =
      (startMatch as RegExpMatchArray).groups?.type?.toLowerCase() ??
      startMatch[1]?.toLowerCase();
    const calloutType: CalloutType = TYPE_MAP[rawType ?? ""] ?? "note";

    const calloutNode = $createCalloutNode(calloutType);

    if (children && children.length > 0) {
      appendNodesToCallout(calloutNode, children);
    } else if (linesInBetween && linesInBetween.length > 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(linesInBetween.join("\n")));
      calloutNode.append(paragraph);
    } else {
      calloutNode.append($createParagraphNode());
    }

    if (isImport) {
      rootNode.append(calloutNode);
    } else {
      rootNode.replace(calloutNode);
      const target = calloutNode.getFirstChild() ?? calloutNode;
      target.selectStart();
    }
  },
  type: "multiline-element",
};
