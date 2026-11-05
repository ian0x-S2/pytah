"use client";

import {
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  TextNode,
} from "lexical";
import type { LexicalEditor, LexicalNode, RangeSelection } from "lexical";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme-context";

import { registerCodeBlockBehavior } from "./code-commands";
import { normalizeCodeLanguageId } from "./languages";
import {
  isCodeLanguageLoaded,
  isCodeThemeLoaded,
  loadCodeLanguage,
  loadCodeThemeFamily,
  ShikiTokenizer,
} from "./shiki-tokenizer";
import type { Tokenizer } from "./shiki-tokenizer";
import { useCodeBlockTheme } from "./theme-context";
import {
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  resolveCodeBlockThemeId,
} from "./themes/registry";
import type { CodeBlockThemeFamily } from "./themes/registry";

/**
 * Mirrors the tokenizer diff equality (text + token style + token
 * type): `true` only when re-tokenizing would produce a splice.
 */
const $tokensDiffer = (
  current: LexicalNode[],
  tokens: LexicalNode[]
): boolean => {
  if (current.length !== tokens.length) {
    return true;
  }
  for (let index = 0; index < tokens.length; index += 1) {
    const currentNode = current[index];
    const tokenNode = tokens[index];
    if (!currentNode || !tokenNode) {
      return true;
    }
    if (currentNode.getType() !== tokenNode.getType()) {
      return true;
    }
    if (
      $isCodeHighlightNode(currentNode) &&
      $isCodeHighlightNode(tokenNode) &&
      (currentNode.getTextContent() !== tokenNode.getTextContent() ||
        currentNode.getStyle() !== tokenNode.getStyle() ||
        currentNode.getHighlightType() !== tokenNode.getHighlightType())
    ) {
      return true;
    }
  }
  return false;
};

type SelectionPoint = RangeSelection["anchor"];

const $isPointInside = (node: CodeNode, point: SelectionPoint): boolean => {
  const pointNode = point.getNode();
  return pointNode === node || node.isParentOf(pointNode);
};

interface RetainedPoint {
  /** Child index for element points (line-break anchors). */
  elementIndex: number | null;
  /** Absolute text offset from the start of the code text. */
  textOffset: number;
}

/**
 * Records one selection end as restorable data. Text ends become absolute
 * text offsets (sum of previous siblings plus the point offset); element
 * ends keep their child index.
 */
const $retainSelectionPoint = (point: SelectionPoint): RetainedPoint => {
  if (point.type === "element") {
    return { elementIndex: point.offset, textOffset: -1 };
  }
  const pointNode = point.getNode();
  const textOffset =
    point.offset +
    pointNode
      .getPreviousSiblings()
      .reduce((offset, sibling) => offset + sibling.getTextContentSize(), 0);
  return { elementIndex: null, textOffset };
};

/**
 * Restores one selection end after the block children were swapped.
 * Tab nodes extend TextNode, so the walk matches the offset accounting
 * above; line breaks consume one offset unit without being selectable.
 */
const $restoreSelectionPoint = (
  node: CodeNode,
  point: SelectionPoint,
  retained: RetainedPoint
): void => {
  if (retained.elementIndex !== null) {
    const index = Math.max(
      0,
      Math.min(retained.elementIndex, node.getChildrenSize())
    );
    point.set(node.getKey(), index, "element");
    return;
  }
  let remaining = retained.textOffset;
  for (const child of node.getChildren()) {
    if ($isTextNode(child)) {
      const size = child.getTextContentSize();
      if (size >= remaining) {
        point.set(child.getKey(), remaining, "text");
        return;
      }
      remaining -= size;
    } else if ($isLineBreakNode(child)) {
      remaining -= child.getTextContentSize();
    }
  }
  // Offset past the end (text shrank): collapse at the last text child.
  const children = node.getChildren();
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index];
    if (child && $isTextNode(child)) {
      point.set(child.getKey(), child.getTextContentSize(), "text");
      return;
    }
  }
  point.set(node.getKey(), 0, "element");
};

/**
 * Synchronously tokenizes a `CodeNode` with the fine-grained Shiki tokenizer
 * once its theme and language chunks are loaded. Preserves out-of-node
 * selections untouched (preventing mount and theme-toggle scroll jumps) and
 * retains in-node carets across token splices.
 */
const $syncShikiTokens = (
  editor: LexicalEditor,
  node: CodeNode,
  codeBlockTheme: string,
  tokenizer: Tokenizer
): void => {
  // Never splice under an active IME session: replacing text nodes
  // mid-composition drops it. The next committed edit re-dirties the node
  // and converges the tokens.
  if (editor.isComposing()) {
    return;
  }
  if (node.getLanguage() === undefined) {
    node.setLanguage(tokenizer.defaultLanguage);
  }
  const previousTheme = node.getTheme();
  if (previousTheme !== codeBlockTheme) {
    node.setTheme(codeBlockTheme);
  }
  if (!node.getIsSyntaxHighlightSupported()) {
    node.setIsSyntaxHighlightSupported(true);
  }
  let tokens: LexicalNode[];
  try {
    tokens = tokenizer.$tokenize(
      node,
      node.getLanguage() ?? tokenizer.defaultLanguage
    );
  } catch {
    return;
  }
  if (!$tokensDiffer(node.getChildren(), tokens)) {
    return;
  }
  const selection = $getSelection();
  if (
    !$isRangeSelection(selection) ||
    (!$isPointInside(node, selection.anchor) &&
      !$isPointInside(node, selection.focus))
  ) {
    // Out-of-node selections are untouched by the splice, so highlighting
    // never relocates the caret into the code block.
    node.splice(0, node.getChildrenSize(), tokens);
    return;
  }
  const retainedAnchor = $retainSelectionPoint(selection.anchor);
  const retainedFocus = $retainSelectionPoint(selection.focus);
  node.splice(0, node.getChildrenSize(), tokens);
  $restoreSelectionPoint(node, selection.anchor, retainedAnchor);
  $restoreSelectionPoint(node, selection.focus, retainedFocus);
};

export function CodeHighlightPlugin({
  themeFamily,
}: {
  /**
   * Explicit family override. Defaults to the shared theme context (fed by
   * the `codeBlockTheme` Editor prop and the per-block chrome picker), so
   * standalone renders without a provider still highlight with the default
   * family (`nord`).
   */
  themeFamily?: CodeBlockThemeFamily;
}) {
  const [editor] = useLexicalComposerContext();
  const { resolvedTheme } = useTheme();
  const themeContext = useCodeBlockTheme();
  const codeBlockTheme = resolveCodeBlockThemeId(
    themeFamily ?? themeContext?.family ?? DEFAULT_CODE_BLOCK_THEME_FAMILY,
    resolvedTheme
  );

  // Tokenization + per-node diff/re-splice is the most expensive
  // synchronous work an editor mount can do; with many code blocks the
  // chained updates starve the first paint (observed multi-second
  // blank freeze opening a code-heavy document). Arm highlighting after the
  // document has painted: content shows first as plain code text, colors
  // land after paint, off the critical path.
  const [armed, setArmed] = useState(false);

  // Re-entrancy guard: registering a transform dirty-marks every node of
  // its type — and every token IS a TextNode — so one re-registration
  // would otherwise run the sync once per token child. The first child
  // syncs the block; the rest skip until the update listener clears the
  // window at commit end.
  const syncingKeysRef = useRef<Set<string>>(new Set());
  const pendingLoadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (armed) {
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setArmed(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) {
        cancelAnimationFrame(raf2);
      }
    };
  }, [armed]);

  useLayoutEffect(() => {
    if (!armed) {
      return;
    }
    let disposed = false;
    const syncingKeys = syncingKeysRef.current;
    const pendingLoads = pendingLoadsRef.current;
    syncingKeys.clear();

    // Warm both light and dark variants of the active family so subsequent
    // `.dark` mode toggles find the sibling theme already loaded and
    // re-tokenize synchronously inside this layout effect.
    void loadCodeThemeFamily(codeBlockTheme);

    const syncNode = (codeNode: CodeNode): void => {
      const key = codeNode.getKey();
      if (syncingKeys.has(key)) {
        return;
      }
      syncingKeys.add(key);

      const language = normalizeCodeLanguageId(
        codeNode.getLanguage() ?? ShikiTokenizer.defaultLanguage
      );
      if (
        !isCodeThemeLoaded(codeBlockTheme) ||
        !isCodeLanguageLoaded(language)
      ) {
        if (codeNode.getIsSyntaxHighlightSupported()) {
          codeNode.setIsSyntaxHighlightSupported(false);
        }
        const loadKey = `${key}:${codeBlockTheme}:${language}`;
        if (!pendingLoads.has(loadKey)) {
          pendingLoads.add(loadKey);
          const preloadNodeAssets = async () => {
            try {
              await Promise.all([
                loadCodeThemeFamily(codeBlockTheme),
                loadCodeLanguage(language),
              ]);
            } catch {
              // Keep plain text when a grammar or theme fails to load.
            }
            pendingLoads.delete(loadKey);
            if (!disposed) {
              editor.update(() => {
                const latest = $getNodeByKey(key);
                if ($isCodeNode(latest)) {
                  latest.markDirty();
                }
              });
            }
          };
          void preloadNodeAssets();
        }
        return;
      }

      $syncShikiTokens(editor, codeNode, codeBlockTheme, ShikiTokenizer);
    };

    const syncParent = (node: LexicalNode): void => {
      const parent = node.getParent();
      if ($isCodeNode(parent)) {
        syncNode(parent);
      }
    };

    const unregisterCode = editor.registerNodeTransform(CodeNode, syncNode);
    const unregisterText = editor.registerNodeTransform(TextNode, syncParent);
    const unregisterHighlight = editor.registerNodeTransform(
      CodeHighlightNode,
      syncParent
    );
    const unregisterBehavior = registerCodeBlockBehavior(editor);
    const unregisterPass = editor.registerUpdateListener(() => {
      syncingKeys.clear();
    });

    return () => {
      disposed = true;
      unregisterCode();
      unregisterText();
      unregisterHighlight();
      unregisterBehavior();
      unregisterPass();
    };
  }, [armed, codeBlockTheme, editor]);

  return null;
}
