"use client";

import { $isCodeHighlightNode, CodeNode } from "@lexical/code";
import { registerCodeHighlighting } from "@lexical/code-shiki";
import type { Tokenizer } from "@lexical/code-shiki";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import type { LexicalNode } from "lexical";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-context";

import { TwinkleplopTokenizer } from "./twinkleplop-tokenizer";

const CODE_BLOCK_THEME_BY_MODE = {
  dark: "github-dark",
  light: "github-light",
} as const;

const $selectionIsInside = (node: LexicalNode): boolean => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const anchorNode = selection.anchor.getNode();
  return anchorNode === node || node.isParentOf(anchorNode);
};

/**
 * Mirrors the tokenizer diff equality (text + token style + token
 * type): `true` only when re-tokenizing would produce a splice, i.e. when
 * letting the highlighter run its transform would change the node.
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

/**
 * Front-runs the highlighter's CodeNode transform so its own tokenize pass
 * diffs to a no-op whenever the caret is NOT inside this code node.
 *
 * Upstream's `$updateAndRetainSelection` does not verify that the current
 * selection belongs to the code node: whenever its tokenize diff produces
 * changes (first highlight, theme swap, a newly usable language) it
 * relocates ANY range selection in the document into the code block, and
 * the untagged nested update then re-applies the DOM selection and scrolls
 * the page to the caret (mount and theme-toggle scroll jump).
 *
 * By tokenizing inline with the final theme first, the diff upstream computes
 * is empty and it returns before touching the selection. This transform must
 * be registered BEFORE `registerCodeHighlighting`: Lexical marks all existing
 * nodes of the type dirty the moment a transform is registered, and transform
 * execution follows registration order, so ours always runs first in a pass.
 *
 * When the caret IS inside the node, only a stale theme is fixed and the
 * re-tokenize is left to the registered tokenizer, whose selection-retention
 * logic correctly remaps an in-node caret across the token swap.
 */
const $ensureTwinkleDiffIsNoOp = (
  node: CodeNode,
  codeBlockTheme: string,
  tokenizer: Tokenizer
): void => {
  if (node.getTheme() !== codeBlockTheme) {
    // Theme must be final before tokenizing: the tokens carry it.
    node.setTheme(codeBlockTheme);
  }
  if ($selectionIsInside(node)) {
    return;
  }

  try {
    const tokens = tokenizer.$tokenize(
      node,
      node.getLanguage() ?? tokenizer.defaultLanguage
    );
    if ($tokensDiffer(node.getChildren(), tokens)) {
      node.splice(0, node.getChildrenSize(), tokens);
    }
  } catch {
    // Tokenizer threw (unknown language): leave this node to the registered
    // transform's own error path.
  }
};

export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  const { resolvedTheme } = useTheme();
  const codeBlockTheme = CODE_BLOCK_THEME_BY_MODE[resolvedTheme];

  // Tokenization + per-node diff/re-splice is the most expensive
  // synchronous work an editor mount can do; with many code blocks the
  // chained updates starve the first paint (observed multi-second
  // blank freeze opening a code-heavy document). Arm highlighting after the
  // document has painted: content shows first as plain code text, colors
  // land one frame later, off the critical path.
  const [armed, setArmed] = useState(false);

  // Registration follows the post-paint arm, keeping the transform on
  // its synchronous path from the first dirty pass onward.
  // Twinkleplop grammars compile at import time and palettes are static
  // imports: there are no async highlighter assets, so registration can
  // follow the arm directly with no `await` in between. Do NOT add an
  // async boundary here: awaiting even an already-resolved promise would
  // push registration outside `act()` in tests, stalling it on React's
  // act queue until the next test's `act()` call.

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

  // ORDERING IS LOAD-BEARING: this transform must be registered before
  // `registerCodeHighlighting` below. Registering a transform marks all
  // existing nodes of its type dirty immediately, so the very first pass
  // after arming already runs through here — tokenizing inline keeps
  // the registered tokenizer's own first pass (and every later pass) a
  // no-op while the caret is elsewhere, which is what prevents the mount
  // scroll jump.
  useEffect(() => {
    if (!armed) {
      return;
    }
    const unregisterPre = editor.registerNodeTransform(CodeNode, (codeNode) => {
      $ensureTwinkleDiffIsNoOp(codeNode, codeBlockTheme, TwinkleplopTokenizer);
    });
    const unregisterUpstream = registerCodeHighlighting(
      editor,
      TwinkleplopTokenizer
    );
    return () => {
      unregisterPre();
      unregisterUpstream();
    };
  }, [armed, codeBlockTheme, editor]);

  return null;
}
