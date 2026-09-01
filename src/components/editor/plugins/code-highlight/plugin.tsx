"use client";

import { $isCodeHighlightNode, $isCodeNode, CodeNode } from "@lexical/code";
import {
  loadCodeLanguage,
  loadCodeTheme,
  registerCodeHighlighting,
  ShikiTokenizer,
} from "@lexical/code-shiki";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-context";

const CODE_BLOCK_THEME_BY_MODE = {
  dark: "github-dark",
  light: "github-light",
} as const;

let shikiThemesPreloaded = false;

const preloadShikiThemes = () => {
  if (shikiThemesPreloaded) {
    return;
  }
  shikiThemesPreloaded = true;
  for (const theme of Object.values(CODE_BLOCK_THEME_BY_MODE)) {
    loadCodeTheme(theme)?.catch(() => undefined);
  }
};

const $selectionIsInside = (node: LexicalNode): boolean => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const anchorNode = selection.anchor.getNode();
  return anchorNode === node || node.isParentOf(anchorNode);
};

/**
 * Mirrors upstream Shiki's own diff equality (text + token style + token
 * type): `true` only when re-tokenizing would produce a splice, i.e. when
 * letting Shiki run its transform would change the node.
 */
const $tokensDiffer = (
  current: LexicalNode[],
  tokens: LexicalNode[]
): boolean => {
  if (current.length !== tokens.length) {
    return true;
  }
  for (let index = 0; index < tokens.length; index++) {
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
 * Front-runs Shiki's CodeNode transform so its own tokenize pass diffs to a
 * no-op whenever the caret is NOT inside this code node.
 *
 * Upstream's `$updateAndRetainSelection` does not verify that the current
 * selection belongs to the code node: whenever its tokenize diff produces
 * changes (first highlight, theme swap, a language that just finished
 * loading) it relocates ANY range selection in the document into the code
 * block, and the untagged nested update then re-applies the DOM selection and
 * scrolls the page to the caret (mount and theme-toggle scroll jump).
 *
 * By tokenizing inline with the final theme first, the diff upstream computes
 * is empty and it returns before touching the selection. This transform must
 * be registered BEFORE `registerCodeHighlighting`: Lexical marks all existing
 * nodes of the type dirty the moment a transform is registered, and transform
 * execution follows registration order, so ours always runs first in a pass.
 *
 * When the caret IS inside the node, only a stale theme is fixed and the
 * re-tokenize is left to Shiki, whose selection-retention logic correctly
 * remaps an in-node caret across the token swap.
 */
const $ensureShikiDiffIsNoOp = (
  node: CodeNode,
  codeBlockTheme: string
): void => {
  if (node.getTheme() !== codeBlockTheme) {
    // Theme must be final before tokenizing: the tokens carry it.
    node.setTheme(codeBlockTheme);
  }
  if ($selectionIsInside(node)) {
    return;
  }

  try {
    const tokens = ShikiTokenizer.$tokenize(
      node,
      node.getLanguage() ?? ShikiTokenizer.defaultLanguage
    );
    if ($tokensDiffer(node.getChildren(), tokens)) {
      node.splice(0, node.getChildrenSize(), tokens);
    }
  } catch {
    // A theme/language asset is still loading: leave this node to Shiki's
    // async flow. When the load resolves it re-dirties the node and this
    // transform runs first in that pass, making Shiki's pass a no-op.
  }
};

/**
 * Starts loading every highlighter asset needed to tokenize the code nodes
 * already in the document (the active theme plus each node's language), so
 * registration below tokenizes synchronously instead of going through
 * Shiki's async load flow. Arming waits for these loads so the first
 * highlight lands after the document has painted with plain code text.
 */
const collectHighlightAssetLoads = (
  editor: LexicalEditor,
  activeTheme: string
): Promise<unknown>[] => {
  const loads: Promise<unknown>[] = [];

  // The loaders return undefined for unknown ids (and shiki dedupes loads),
  // so unconditional calls are safe — already-loaded assets resolve fast.
  loads.push(loadCodeTheme(activeTheme) ?? Promise.resolve());

  editor.getEditorState().read(() => {
    const queue: LexicalNode[] = [$getRoot()];
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) {
        continue;
      }

      if ($isCodeNode(node)) {
        const language = node.getLanguage() ?? ShikiTokenizer.defaultLanguage;
        loads.push(loadCodeLanguage(language) ?? Promise.resolve());
      } else if ($isElementNode(node)) {
        queue.push(...node.getChildren());
      }
    }
  });

  return loads;
};

export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  const { resolvedTheme } = useTheme();
  const codeBlockTheme = CODE_BLOCK_THEME_BY_MODE[resolvedTheme];

  // Shiki tokenization + per-node diff/re-splice is the most expensive
  // synchronous work an editor mount can do; with many code blocks the
  // chained async→sync updates starve the first paint (observed multi-second
  // blank freeze opening a code-heavy document). Arm highlighting after the
  // document has painted: content shows first as plain code text, colors
  // land one frame later, off the critical path.
  const [armed, setArmed] = useState(false);

  // Registration waits until the assets for the already-mounted code nodes
  // are loaded, keeping Shiki's transform on its synchronous path from the
  // first dirty pass onward (see `collectHighlightAssetLoads`).
  const [ready, setReady] = useState(false);

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

  useEffect(() => {
    if (!armed) {
      return;
    }
    let cancelled = false;
    const loads = collectHighlightAssetLoads(editor, codeBlockTheme);
    // Arm even when a load fails: `$ensureShikiDiffIsNoOp` falls back per
    // node to Shiki's async flow instead of never arming.
    Promise.all(loads).finally(() => {
      if (!cancelled) {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [armed, codeBlockTheme, editor]);

  // ORDERING IS LOAD-BEARING: this transform must be registered before
  // `registerCodeHighlighting` below. Registering a transform marks all
  // existing nodes of its type dirty immediately, so the very first pass
  // after arming already runs through here — tokenizing inline keeps
  // Shiki's own first pass (and every later pass) a no-op while the caret
  // is elsewhere, which is what prevents the mount scroll jump.
  useEffect(() => {
    if (!ready) {
      return;
    }
    preloadShikiThemes();
    return editor.registerNodeTransform(CodeNode, (codeNode) => {
      $ensureShikiDiffIsNoOp(codeNode, codeBlockTheme);
    });
  }, [ready, codeBlockTheme, editor]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    return registerCodeHighlighting(editor);
  }, [ready, editor]);

  return null;
}
