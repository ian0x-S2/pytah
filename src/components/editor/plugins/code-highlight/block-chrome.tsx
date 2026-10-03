"use client";

import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, $getRoot } from "lexical";
import { useContext, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { CodeLanguageSelect } from "./code-language-select";
import { CodeThemeSelect } from "./code-theme-select";
import { CodeGutterHostContext } from "./gutter-host";
import { normalizeCodeLanguageId } from "./languages";
import { useCodeBlockTheme } from "./theme-context";
import { DEFAULT_CODE_BLOCK_THEME_FAMILY } from "./themes/registry";

interface CodeBlockChromeAnchor {
  key: string;
  language: string;
  nodeKey: string;
  right: number;
  top: number;
}

const CHROME_TOP_INSET = 8;
const CHROME_RIGHT_INSET = 8;

const sameAnchors = (
  left: CodeBlockChromeAnchor[],
  right: CodeBlockChromeAnchor[]
): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((anchor, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      anchor.key === other.key &&
      anchor.nodeKey === other.nodeKey &&
      anchor.language === other.language &&
      anchor.top === other.top &&
      anchor.right === other.right
    );
  });
};

/**
 * Per-block chrome overlay for editor code blocks: theme picker + language
 * picker over the top-right corner of each block.
 *
 * Lexical renders a `CodeNode` as a single `<pre>` with no chrome, so the
 * pickers live outside the editable root (portal'd into the positioned
 * wrapper host, like the line-number gutter) and are absolutely positioned
 * over each code block. Picking a theme re-tokenizes every block through
 * the shared theme context; picking a language calls
 * `CodeNode.setLanguage`, which re-runs the Twinkleplop tokenizer through
 * the existing highlight transform.
 */
export function CodeBlockChromePlugin({ className }: { className?: string }) {
  const [editor] = useLexicalComposerContext();
  const host = useContext(CodeGutterHostContext);
  const themeContext = useCodeBlockTheme();
  const family = themeContext?.family ?? DEFAULT_CODE_BLOCK_THEME_FAMILY;
  const [anchors, setAnchors] = useState<CodeBlockChromeAnchor[]>([]);
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  useEffect(
    () =>
      editor.registerEditableListener((editable) => setIsEditable(editable)),
    [editor]
  );

  useEffect(() => {
    const collect = (): void => {
      if (!host) {
        return;
      }
      const hostRect = host.getBoundingClientRect();
      const next: CodeBlockChromeAnchor[] = [];
      editor.getEditorState().read(() => {
        for (const child of $getRoot().getChildren()) {
          if (!$isCodeNode(child)) {
            continue;
          }
          const element = editor.getElementByKey(child.getKey());
          if (!(element instanceof HTMLElement)) {
            continue;
          }
          const rect = element.getBoundingClientRect();
          next.push({
            key: child.getKey(),
            language: normalizeCodeLanguageId(child.getLanguage()),
            nodeKey: child.getKey(),
            right: Math.round(hostRect.right - rect.right + CHROME_RIGHT_INSET),
            top: Math.round(rect.top - hostRect.top + CHROME_TOP_INSET),
          });
        }
      });
      setAnchors((previous) => (sameAnchors(previous, next) ? previous : next));
    };

    collect();
    const unregister = editor.registerUpdateListener(() => {
      collect();
    });
    // Same layout-without-update case as the gutter: the density toggle only
    // flips `data-density` (all rhythm is CSS vars), so anchors go stale
    // until the next edit. The host box tracks the wrapper on density, zen
    // and container changes — re-collect on its resize.
    const observer = new ResizeObserver(() => {
      collect();
    });
    if (host) {
      observer.observe(host);
    }
    window.addEventListener("resize", collect);
    return () => {
      unregister();
      observer.disconnect();
      window.removeEventListener("resize", collect);
    };
  }, [editor, host]);

  if (!host || !isEditable) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="false"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 select-none",
        className
      )}
    >
      {anchors.map((anchor) => (
        <div
          className="pointer-events-auto absolute top-[var(--code-chrome-top)] right-[var(--code-chrome-right)] flex gap-1"
          data-code-chrome={anchor.key}
          key={anchor.key}
          style={
            {
              "--code-chrome-right": `${anchor.right}px`,
              "--code-chrome-top": `${anchor.top}px`,
            } as CSSProperties
          }
        >
          <CodeThemeSelect
            onValueChange={(next) => themeContext?.setFamily(next)}
            value={family}
          />
          <CodeLanguageSelect
            onValueChange={(value) => {
              editor.update(() => {
                const node = $getNodeByKey(anchor.nodeKey);
                if ($isCodeNode(node)) {
                  node.setLanguage(value);
                }
              });
            }}
            value={anchor.language}
          />
        </div>
      ))}
    </div>,
    host
  );
}
