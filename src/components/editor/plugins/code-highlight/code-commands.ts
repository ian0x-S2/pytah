"use client";

import {
  $getCodeLineDirection,
  $getEndOfCodeInLine,
  $getFirstCodeNodeOfLine,
  $getLastCodeNodeOfLine,
  $getStartOfCodeInLine,
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code";
import { mergeRegister } from "@lexical/utils";
import {
  $createLineBreakNode,
  $createPoint,
  $createTabNode,
  $createTextNode,
  $getCaretRange,
  $getCaretRangeInDirection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $getSiblingCaret,
  $getTextPointCaret,
  $insertNodes,
  $isLineBreakNode,
  $isRangeSelection,
  $isTabNode,
  $normalizeCaret,
  $setSelectionFromCaretRange,
  COMMAND_PRIORITY_LOW,
  INDENT_CONTENT_COMMAND,
  INSERT_TAB_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_TAB_COMMAND,
  MOVE_TO_END,
  MOVE_TO_START,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import type {
  BaseSelection,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  LineBreakNode,
  RangeSelection,
  TabNode,
} from "lexical";

import { registerCodePaste } from "./paste";

type CodeLineChild = CodeHighlightNode | TabNode | LineBreakNode;

const $isCodeLineChild = (node: LexicalNode | null): node is CodeLineChild =>
  $isCodeHighlightNode(node) || $isTabNode(node) || $isLineBreakNode(node);

const $isSelectionInCode = (
  selection: BaseSelection | null
): selection is RangeSelection => {
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const anchorNode = selection.anchor.getNode();
  const maybeAnchorCodeNode = $isCodeNode(anchorNode)
    ? anchorNode
    : anchorNode.getParent();
  const focusNode = selection.focus.getNode();
  const maybeFocusCodeNode = $isCodeNode(focusNode)
    ? focusNode
    : focusNode.getParent();
  return (
    $isCodeNode(maybeAnchorCodeNode) &&
    maybeAnchorCodeNode.is(maybeFocusCodeNode)
  );
};

const $getCodeLines = (
  selection: RangeSelection
): (CodeHighlightNode | TabNode)[][] => {
  const nodes = selection.getNodes();
  const lines: (CodeHighlightNode | TabNode)[][] = [];
  if (nodes.length === 1 && $isCodeNode(nodes[0])) {
    return lines;
  }
  let lastLine: (CodeHighlightNode | TabNode)[] = [];
  for (const node of nodes) {
    if (!$isCodeLineChild(node)) {
      return [];
    }
    if ($isLineBreakNode(node)) {
      if (lastLine.length > 0) {
        lines.push(lastLine);
        lastLine = [];
      }
    } else {
      lastLine.push(node);
    }
  }
  if (lastLine.length > 0) {
    const selectionEnd = selection.isBackward()
      ? selection.anchor
      : selection.focus;
    const [firstInLastLine] = lastLine;
    if (firstInLastLine) {
      const lastPoint = $createPoint(firstInLastLine.getKey(), 0, "text");
      if (!selectionEnd.is(lastPoint)) {
        lines.push(lastLine);
      }
    }
  }
  return lines;
};

const $handleTab = (shiftKey: boolean): LexicalCommand<void> | null => {
  const selection = $getSelection();
  if (!$isSelectionInCode(selection)) {
    return null;
  }
  const indentOrOutdent = shiftKey
    ? OUTDENT_CONTENT_COMMAND
    : INDENT_CONTENT_COMMAND;
  const tabOrOutdent = shiftKey ? OUTDENT_CONTENT_COMMAND : INSERT_TAB_COMMAND;
  const { anchor, focus } = selection;

  if (anchor.is(focus)) {
    return tabOrOutdent;
  }

  const codeLines = $getCodeLines(selection);
  if (codeLines.length !== 1) {
    return indentOrOutdent;
  }
  const [codeLine] = codeLines;
  const firstInLine = codeLine?.[0];
  if (!firstInLine) {
    return indentOrOutdent;
  }

  const selectionFirst = selection.isBackward() ? focus : anchor;
  const selectionLast = selection.isBackward() ? anchor : focus;

  const firstOfLine = $getFirstCodeNodeOfLine(firstInLine);
  const lastOfLine = $getLastCodeNodeOfLine(firstInLine);
  const anchorOfLine = $createPoint(firstOfLine.getKey(), 0, "text");
  const focusOfLine = $createPoint(
    lastOfLine.getKey(),
    lastOfLine.getTextContentSize(),
    "text"
  );

  if (
    selectionFirst.isBefore(anchorOfLine) ||
    focusOfLine.isBefore(selectionLast)
  ) {
    return indentOrOutdent;
  }

  if (
    anchorOfLine.isBefore(selectionFirst) ||
    selectionLast.isBefore(focusOfLine)
  ) {
    return tabOrOutdent;
  }

  return indentOrOutdent;
};

const $indentOrOutdentCodeLines = (
  selection: RangeSelection,
  codeLines: (CodeHighlightNode | TabNode)[][],
  type: LexicalCommand<void>
): void => {
  for (let index = 0; index < codeLines.length; index += 1) {
    const line = codeLines[index];
    const firstNode = line?.[0];
    if (!firstNode) {
      continue;
    }
    const firstOfLine =
      index === 0 ? $getFirstCodeNodeOfLine(firstNode) : firstNode;
    if (type === INDENT_CONTENT_COMMAND) {
      const tabNode = $createTabNode();
      firstOfLine.insertBefore(tabNode);
      if (index === 0) {
        const anchorKey = selection.isBackward() ? "focus" : "anchor";
        const anchorLine = $createPoint(firstOfLine.getKey(), 0, "text");
        if (selection[anchorKey].is(anchorLine)) {
          selection[anchorKey].set(tabNode.getKey(), 0, "text");
        }
      }
    } else if ($isTabNode(firstOfLine)) {
      firstOfLine.remove();
    }
  }
};

const $handleMultilineIndent = (type: LexicalCommand<void>): boolean => {
  const selection = $getSelection();
  if (!$isSelectionInCode(selection)) {
    return false;
  }
  const codeLines = $getCodeLines(selection);
  const codeLinesLength = codeLines.length;

  if (codeLinesLength === 0 && selection.isCollapsed()) {
    if (type === INDENT_CONTENT_COMMAND) {
      selection.insertNodes([$createTabNode()]);
    }
    return true;
  }

  if (
    codeLinesLength === 0 &&
    type === INDENT_CONTENT_COMMAND &&
    selection.getTextContent() === "\n"
  ) {
    const tabNode = $createTabNode();
    const lineBreakNode = $createLineBreakNode();
    const direction = selection.isBackward() ? "previous" : "next";
    selection.insertNodes([tabNode, lineBreakNode]);
    const siblingCaret = $getSiblingCaret(lineBreakNode, "next");
    if (siblingCaret) {
      $setSelectionFromCaretRange(
        $getCaretRangeInDirection(
          $getCaretRange(
            $getTextPointCaret(tabNode, "next", 0),
            $normalizeCaret(siblingCaret)
          ),
          direction
        )
      );
    }
    return true;
  }

  $indentOrOutdentCodeLines(selection, codeLines, type);
  return true;
};

const $handleArrowExitCodeBlock = (
  selection: RangeSelection,
  anchorNode: CodeHighlightNode | TabNode,
  anchorOffset: number,
  arrowIsUp: boolean,
  event: KeyboardEvent
): boolean => {
  if (!selection.isCollapsed()) {
    return false;
  }
  const codeNode = anchorNode.getParentOrThrow();
  if (
    arrowIsUp &&
    anchorOffset === 0 &&
    anchorNode.getPreviousSibling() === null &&
    codeNode.getPreviousSibling() === null
  ) {
    codeNode.selectPrevious();
    event.preventDefault();
    return true;
  }
  if (
    !arrowIsUp &&
    anchorOffset === anchorNode.getTextContentSize() &&
    anchorNode.getNextSibling() === null &&
    codeNode.getNextSibling() === null
  ) {
    codeNode.selectNext();
    event.preventDefault();
    return true;
  }
  return false;
};

const $moveCodeLineRange = (
  range: LexicalNode[],
  linebreak: LineBreakNode,
  sibling: LexicalNode,
  arrowIsUp: boolean
): void => {
  let maybeInsertionPoint: LexicalNode | null = null;
  if ($isCodeLineChild(sibling)) {
    maybeInsertionPoint = arrowIsUp
      ? $getFirstCodeNodeOfLine(sibling)
      : $getLastCodeNodeOfLine(sibling);
  }
  let insertionPoint = maybeInsertionPoint ?? sibling;
  linebreak.remove();
  for (const node of range) {
    node.remove();
  }
  if (arrowIsUp) {
    for (const node of range) {
      insertionPoint.insertBefore(node);
    }
    insertionPoint.insertBefore(linebreak);
  } else {
    insertionPoint.insertAfter(linebreak);
    insertionPoint = linebreak;
    for (const node of range) {
      insertionPoint.insertAfter(node);
      insertionPoint = node;
    }
  }
};

const $handleShiftLines = (
  type: LexicalCommand<KeyboardEvent>,
  event: KeyboardEvent
): boolean => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const { anchor, focus } = selection;
  const anchorOffset = anchor.offset;
  const focusOffset = focus.offset;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const arrowIsUp = type === KEY_ARROW_UP_COMMAND;

  if (
    !$isSelectionInCode(selection) ||
    !($isCodeHighlightNode(anchorNode) || $isTabNode(anchorNode)) ||
    !($isCodeHighlightNode(focusNode) || $isTabNode(focusNode))
  ) {
    return false;
  }

  if (!event.altKey) {
    return $handleArrowExitCodeBlock(
      selection,
      anchorNode,
      anchorOffset,
      arrowIsUp,
      event
    );
  }

  const start = anchorNode.isBefore(focusNode)
    ? $getFirstCodeNodeOfLine(anchorNode)
    : $getFirstCodeNodeOfLine(focusNode);
  const end = anchorNode.isBefore(focusNode)
    ? $getLastCodeNodeOfLine(focusNode)
    : $getLastCodeNodeOfLine(anchorNode);
  if (!start || !end) {
    return false;
  }
  const range = start.getNodesBetween(end);
  for (const node of range) {
    if (!$isCodeLineChild(node)) {
      return false;
    }
  }

  event.preventDefault();
  event.stopPropagation();

  const linebreak = arrowIsUp
    ? start.getPreviousSibling()
    : end.getNextSibling();
  if (!$isLineBreakNode(linebreak)) {
    return true;
  }
  const sibling = arrowIsUp
    ? linebreak.getPreviousSibling()
    : linebreak.getNextSibling();
  if (!sibling) {
    return true;
  }

  $moveCodeLineRange(range, linebreak, sibling, arrowIsUp);
  selection.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset);
  return true;
};

const $handleMoveTo = (
  type: LexicalCommand<KeyboardEvent>,
  event: KeyboardEvent
): boolean => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const { anchor, focus } = selection;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const isMoveToStart = type === MOVE_TO_START;

  if (
    !$isSelectionInCode(selection) ||
    !($isCodeHighlightNode(anchorNode) || $isTabNode(anchorNode)) ||
    !($isCodeHighlightNode(focusNode) || $isTabNode(focusNode))
  ) {
    return false;
  }

  const direction = $getCodeLineDirection(focusNode);
  const moveToStart = direction === "rtl" ? !isMoveToStart : isMoveToStart;
  if (moveToStart) {
    const start = $getStartOfCodeInLine(focusNode, focus.offset);
    if (start === null) {
      focusNode.getParentOrThrow().selectStart();
    } else {
      const { node, offset } = start;
      if ($isLineBreakNode(node)) {
        node.selectNext(0, 0);
      } else {
        selection.setTextNodeRange(node, offset, node, offset);
      }
    }
  } else {
    const node = $getEndOfCodeInLine(focusNode);
    node.select();
  }
  event.preventDefault();
  event.stopPropagation();
  return true;
};

const updateCodeGutter = (node: CodeNode, editor: LexicalEditor): void => {
  const codeElement = editor.getElementByKey(node.getKey());
  if (!codeElement) {
    return;
  }
  const children = node.getChildren();
  const childrenLength = children.length;
  const elementWithCache = codeElement as HTMLElement & {
    __cachedChildrenLength?: number;
  };
  if (childrenLength === elementWithCache.__cachedChildrenLength) {
    return;
  }
  elementWithCache.__cachedChildrenLength = childrenLength;
  let gutter = "1";
  let count = 1;
  for (let index = 0; index < childrenLength; index += 1) {
    if ($isLineBreakNode(children[index])) {
      count += 1;
      gutter += `\n${count}`;
    }
  }
  codeElement.dataset.gutter = gutter;
};

/**
 * Registers Lexical code-block editing commands (Tab / Shift+Tab indentation,
 * Alt+Up/Down line shifting, Home/End line boundaries, and orphaned
 * `CodeHighlightNode` cleanup) without pulling in `@lexical/code-shiki` or
 * `@lexical/code-prism`.
 */
export function registerCodeBlockBehavior(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([CodeNode, CodeHighlightNode])) {
    throw new Error(
      "CodeHighlightPlugin: CodeNode or CodeHighlightNode not registered on editor"
    );
  }

  const registrations: (() => void)[] = [];

  if (!(editor as LexicalEditor & { _headless?: boolean })._headless) {
    registrations.push(
      editor.registerMutationListener(
        CodeNode,
        (mutations) => {
          editor.getEditorState().read(() => {
            for (const [key, type] of mutations) {
              if (type !== "destroyed") {
                const node = $getNodeByKey(key);
                if ($isCodeNode(node)) {
                  updateCodeGutter(node, editor);
                }
              }
            }
          });
        },
        { skipInitialization: false }
      )
    );
  }

  registrations.push(
    registerCodePaste(editor),
    editor.registerNodeTransform(CodeHighlightNode, (node) => {
      if (!$isCodeNode(node.getParent())) {
        node.replace($createTextNode(node.getTextContent()));
      }
    }),
    editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const command = $handleTab(event.shiftKey);
        if (command === null) {
          return false;
        }
        event.preventDefault();
        editor.dispatchCommand(command, undefined);
        return true;
      },
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      INSERT_TAB_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isSelectionInCode(selection)) {
          return false;
        }
        $insertNodes([$createTabNode()]);
        return true;
      },
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => $handleMultilineIndent(INDENT_CONTENT_COMMAND),
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      () => $handleMultilineIndent(OUTDENT_CONTENT_COMMAND),
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isSelectionInCode(selection)) {
          return false;
        }
        const firstNode = $getRoot().getFirstDescendant();
        const anchorNode = selection.anchor.getNode();
        if (
          firstNode &&
          anchorNode &&
          firstNode.getKey() === anchorNode.getKey()
        ) {
          return false;
        }
        return $handleShiftLines(KEY_ARROW_UP_COMMAND, event);
      },
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isSelectionInCode(selection)) {
          return false;
        }
        const lastNode = $getRoot().getLastDescendant();
        const anchorNode = selection.anchor.getNode();
        if (
          lastNode &&
          anchorNode &&
          lastNode.getKey() === anchorNode.getKey()
        ) {
          return false;
        }
        return $handleShiftLines(KEY_ARROW_DOWN_COMMAND, event);
      },
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      MOVE_TO_START,
      (event) => $handleMoveTo(MOVE_TO_START, event),
      COMMAND_PRIORITY_LOW
    ),
    editor.registerCommand(
      MOVE_TO_END,
      (event) => $handleMoveTo(MOVE_TO_END, event),
      COMMAND_PRIORITY_LOW
    )
  );

  return mergeRegister(...registrations);
}
