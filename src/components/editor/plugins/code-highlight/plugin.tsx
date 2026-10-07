"use client";

import {
  $isCodeHighlightNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code";
import { registerCodeHighlighting } from "@lexical/code-shiki";
import type { Tokenizer } from "@lexical/code-shiki";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  TextNode,
} from "lexical";
import type { LexicalEditor, LexicalNode, RangeSelection } from "lexical";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme-context";

import { useCodeBlockTheme } from "./theme-context";
import {
  CODE_BLOCK_TOKEN_VAR_PREFIX,
  DEFAULT_CODE_BLOCK_THEME_FAMILY,
  resolveCodeBlockThemeId,
} from "./themes/registry";
import type { CodeBlockThemeFamily } from "./themes/registry";
import { TwinkleplopTokenizer } from "./twinkleplop-tokenizer";

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
 * Family part of a resolved theme id (`nord-dark` -> `nord`). Ids outside
 * the `<family>-<mode>` shape keep their whole value, so legacy/pasted
 * ids never collapse into a bogus shared prefix.
 */
const codeBlockThemeFamilyOf = (themeId: string): string =>
  themeId.replace(/-(?:light|dark)$/u, "");

/**
 * True when the block's children are already this tokenizer's output with
 * var-reference styles. Tokenized children always contain a
 * CodeHighlightNode (bare gap nodes included) or a non-text structure
 * (line breaks); raw markdown-seeded blocks hold plain TextNodes only.
 * Tokens still carrying baked hex styles (HTML pasted from an older
 * snapshot) force a full pass so the stale colors are spliced away.
 */
const $isVarTokenized = (node: CodeNode): boolean => {
  let sawToken = false;
  for (const child of node.getChildren()) {
    if ($isCodeHighlightNode(child)) {
      sawToken = true;
      const style = child.getStyle();
      if (
        style !== "" &&
        !style.startsWith(`color: var(${CODE_BLOCK_TOKEN_VAR_PREFIX}`)
      ) {
        return false;
      }
    } else if (!$isTextNode(child)) {
      sawToken = true;
    }
  }
  return sawToken;
};

/**
 * Front-runs the highlighter's CodeNode transform so its own tokenize pass
 * diffs to a no-op. Upstream's `$updateAndRetainSelection` does not verify
 * that the current selection belongs to the code node: whenever its tokenize
 * diff produces changes (first highlight, theme swap, a newly usable
 * language) it relocates ANY range selection in the document into the code
 * block, and the untagged nested update then re-applies the DOM selection
 * and scrolls the page to the caret (mount and theme-toggle scroll jump).
 *
 * By tokenizing inline with the final theme first, the diff upstream computes
 * is empty and it returns before touching the selection. This transform must
 * be registered BEFORE `registerCodeHighlighting`: Lexical marks all existing
 * nodes of the type dirty the moment a transform is registered, and transform
 * execution follows registration order, so ours always runs first in a pass.
 */
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
 * text offsets (sum of previous siblings plus the point offset, like
 * upstream); element ends keep their child index.
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
 * Inline token sync that owns re-tokenization (it cannot be left to
 * upstream): upstream's CodeNode transform gates on Shiki theme bundles
 * (`isCodeThemeLoaded`), and our `"<family>-<mode>"` ids only match a bundle
 * by accident (`github-*`, `everforest-*`). For `nord-*`/`catppuccin-*` the
 * gate never opens, so upstream returns early forever and tokens would stay
 * stale whenever the caret sits inside the block (the theme picker keeps the
 * caret via mousedown-preventDefault, so family switches almost always hit
 * this). When the caret is inside, the splice retains it through text
 * offsets, mirroring upstream's `$updateAndRetainSelection`.
 *
 * `skipIfTokenized` marks a re-registration pass from a mode-only flip:
 * token colors are var references resolved by `EditorContent`'s wrapper
 * vars and `resolveThemedTokenType` gates role remaps on the family prefix
 * only (never light/dark), so such passes converge through the `CodeNode`
 * theme id alone — no tokenize round-trip, no splice. Typing, language
 * changes, and family switches (which may remap roles) always tokenize.
 */
const $syncTwinkleTokens = (
  editor: LexicalEditor,
  node: CodeNode,
  codeBlockTheme: string,
  tokenizer: Tokenizer,
  skipIfTokenized: boolean
): void => {
  const previousTheme = node.getTheme();
  if (previousTheme !== codeBlockTheme) {
    // Theme must be final before tokenizing: the tokens carry it.
    node.setTheme(codeBlockTheme);
  }
  // Never splice under an active IME session: replacing text nodes
  // mid-composition drops it. The next committed edit re-dirties the node
  // and converges the tokens.
  if (editor.isComposing()) {
    return;
  }
  if (skipIfTokenized && $isVarTokenized(node)) {
    // Mode-only flip on an already-tokenized block: children are final.
    return;
  }
  let tokens: LexicalNode[];
  try {
    tokens = tokenizer.$tokenize(
      node,
      node.getLanguage() ?? tokenizer.defaultLanguage
    );
  } catch {
    // Tokenizer threw (unknown language): leave this node to the registered
    // transform's own error path.
    return;
  }
  const selection = $getSelection();
  if (!$tokensDiffer(node.getChildren(), tokens)) {
    return;
  }
  if (
    !$isRangeSelection(selection) ||
    (!$isPointInside(node, selection.anchor) &&
      !$isPointInside(node, selection.focus))
  ) {
    // Out-of-node selections are untouched by the splice, so upstream keeps
    // diffing to a no-op and never relocates the caret (scroll-jump fix).
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
   * standalone renders without a provider still highlight with GitHub.
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
  // land one frame later, off the critical path.
  const [armed, setArmed] = useState(false);
  // Theme id captured at the last transform registration; lets the
  // registration effect tell mode-only flips (skip) from family switches
  // (full re-tokenize) on re-render.
  const lastRegisteredThemeRef = useRef<string | null>(null);

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

  // ORDERING IS LOAD-BEARING: these transforms must be registered before
  // `registerCodeHighlighting` below. Registering a transform marks all
  // existing nodes of its type dirty immediately, so the very first pass
  // after arming already runs through here — tokenizing inline keeps
  // the registered tokenizer's own first pass (and every later pass) a
  // no-op, which is what prevents the mount scroll jump. The text-level
  // hooks mirror upstream's own TextNode/CodeHighlightNode pairing: typing
  // dirties text nodes, not the CodeNode, so without them edits made with
  // the caret inside the block would never re-tokenize.
  //
  // Layout effect (not passive): a theme flip re-renders the plugin and
  // re-registers the transforms here, synchronously before the browser
  // paints. Registration's dirty-marking update then commits in a
  // microtask — still pre-paint — so family switches that remap token
  // roles splice and repaint in the same frame as the wrapper vars, with
  // no flash of the old palette. The arm above still gates mount: this
  // effect stays a no-op until the document has painted, and the mode-only
  // path in `$syncTwinkleTokens` never splices at all.
  useLayoutEffect(() => {
    if (!armed) {
      return;
    }
    // A re-registration from a mode-only flip (family unchanged) dirties
    // every existing block, including through the text-level hooks. Token
    // colors are wrapper vars and role remaps are family-gated, so that
    // pass converges through `setTheme` alone; the flag clears at the end
    // of the commit so later typing passes tokenize normally. Family
    // switches keep the full re-tokenize because roles may remap.
    const previousTheme = lastRegisteredThemeRef.current;
    lastRegisteredThemeRef.current = codeBlockTheme;
    let skipIfTokenized =
      previousTheme !== null &&
      previousTheme !== codeBlockTheme &&
      codeBlockThemeFamilyOf(previousTheme) ===
        codeBlockThemeFamilyOf(codeBlockTheme);
    const syncNode = (codeNode: CodeNode): void => {
      $syncTwinkleTokens(
        editor,
        codeNode,
        codeBlockTheme,
        TwinkleplopTokenizer,
        skipIfTokenized
      );
    };
    const syncParent = (node: LexicalNode): void => {
      const parent = node.getParent();
      if ($isCodeNode(parent)) {
        syncNode(parent);
      }
    };
    const unregisterPre = editor.registerNodeTransform(CodeNode, syncNode);
    const unregisterPreText = editor.registerNodeTransform(
      TextNode,
      syncParent
    );
    const unregisterPreHighlight = editor.registerNodeTransform(
      CodeHighlightNode,
      syncParent
    );
    const unregisterUpstream = registerCodeHighlighting(
      editor,
      TwinkleplopTokenizer
    );
    const unregisterPass = editor.registerUpdateListener(() => {
      // First commit after registration ends the skip window.
      skipIfTokenized = false;
    });
    return () => {
      unregisterPre();
      unregisterPreText();
      unregisterPreHighlight();
      unregisterUpstream();
      unregisterPass();
    };
  }, [armed, codeBlockTheme, editor]);

  return null;
}
