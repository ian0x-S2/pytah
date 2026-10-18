import type { MultilineElementTransformer } from "@lexical/markdown";
import {
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  ParagraphNode,
} from "lexical";

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

export const CALLOUT_MARKDOWN_TRANSFORMER: MultilineElementTransformer = {
  dependencies: [CalloutNode, ParagraphNode],
  export: (node, traverseChildren) => {
    if (!$isCalloutNode(node)) {
      return null;
    }
    const alertType = node.getCalloutType().toUpperCase();
    const childrenText = traverseChildren(node).trim();
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
    if (contentLines.length === 0) {
      calloutNode.append($createParagraphNode());
    } else {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(contentLines.join("\n")));
      calloutNode.append(paragraph);
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
    const paragraph = $createParagraphNode();

    if (children && children.length > 0) {
      let hasInline = false;
      for (const child of children) {
        if ($isElementNode(child)) {
          if (hasInline) {
            calloutNode.append(paragraph);
            hasInline = false;
          }
          calloutNode.append(child);
        } else {
          paragraph.append(child);
          hasInline = true;
        }
      }
      if (hasInline || calloutNode.getChildrenSize() === 0) {
        calloutNode.append(paragraph);
      }
    } else if (linesInBetween && linesInBetween.length > 0) {
      paragraph.append($createTextNode(linesInBetween.join("\n")));
      calloutNode.append(paragraph);
    } else {
      calloutNode.append(paragraph);
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
