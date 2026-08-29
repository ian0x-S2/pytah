"use client";

import { $isCodeNode, CodeNode } from "@lexical/code";
import {
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
  type LexicalNode,
  SKIP_DOM_SELECTION_TAG,
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

const $rethemeCodeNode = (node: CodeNode, codeBlockTheme: string): void => {
  // When the caret lives inside this code node, shiki's own
  // selection-retention logic is correct and handles the swap.
  if ($selectionIsInside(node)) {
    node.setTheme(codeBlockTheme);
    return;
  }

  // Otherwise re-tokenize inline so shiki's own transform diffs to a no-op.
  // Without this, its $updateAndRetainSelection pulls the out-of-node caret
  // into the code block and the browser scrolls it into view (theme-toggle
  // scroll jump).
  try {
    const tokens = ShikiTokenizer.$tokenize(
      node,
      node.getLanguage() ?? ShikiTokenizer.defaultLanguage
    );
    node.splice(0, node.getChildrenSize(), tokens);
  } catch {
    // Shiki theme/language not loaded yet — let the node transform finish
    // the swap through its async loading flow.
  }
  node.setTheme(codeBlockTheme);
};

const $rethemeStaleCodeNodes = (codeBlockTheme: string): void => {
  const queue: LexicalNode[] = [$getRoot()];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      continue;
    }

    if ($isCodeNode(node)) {
      if (node.getTheme() !== codeBlockTheme) {
        $rethemeCodeNode(node, codeBlockTheme);
      }
    } else if ($isElementNode(node)) {
      queue.push(...node.getChildren());
    }
  }
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
    return registerCodeHighlighting(editor);
  }, [armed, editor]);

  useEffect(() => {
    if (!armed) {
      return;
    }
    return editor.registerNodeTransform(CodeNode, (codeNode) => {
      if (codeNode.getTheme() !== codeBlockTheme) {
        codeNode.setTheme(codeBlockTheme);
      }
    });
  }, [armed, codeBlockTheme, editor]);

  useEffect(() => {
    if (!armed) {
      return;
    }
    preloadShikiThemes();

    editor.update(
      () => {
        $rethemeStaleCodeNodes(codeBlockTheme);
      },
      // Cosmetic-only update: without this tag Lexical re-applies the DOM
      // selection, which implicitly refocuses the contenteditable and makes
      // the browser scroll to the caret (e.g. when toggling themes).
      { discrete: true, tag: SKIP_DOM_SELECTION_TAG }
    );
  }, [armed, codeBlockTheme, editor]);

  return null;
}
