"use client";

import { $isCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, $getRoot } from "lexical";
import { useContext, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { CodeLanguageSelect } from "./code-language-select";
import { CodeGutterHostContext } from "./gutter-host";
import { normalizeCodeLanguageId } from "./languages";

interface CodeLanguageAnchor {
  key: string;
  language: string;
  nodeKey: string;
  right: number;
  top: number;
}

const LANGUAGE_TOP_INSET = 8;
const LANGUAGE_RIGHT_INSET = 8;

const sameAnchors = (
  left: CodeLanguageAnchor[],
  right: CodeLanguageAnchor[]
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
 * Language picker overlay for editor code blocks.
 *
 * Lexical renders a `CodeNode` as a single `<pre>` with no chrome, so the
 * picker lives outside the editable root (portal'd into the positioned
 * wrapper host, like the line-number gutter) and is absolutely positioned
 * over the top-right corner of each code block. Picking a language calls
 * `CodeNode.setLanguage`, which re-runs the Twinkleplop tokenizer through
 * the existing highlight transform.
 */
export function CodeLanguageSelectPlugin({
  className,
}: {
  className?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const host = useContext(CodeGutterHostContext);
  const [anchors, setAnchors] = useState<CodeLanguageAnchor[]>([]);
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
      const next: CodeLanguageAnchor[] = [];
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
            right: Math.round(
              hostRect.right - rect.right + LANGUAGE_RIGHT_INSET
            ),
            top: Math.round(rect.top - hostRect.top + LANGUAGE_TOP_INSET),
          });
        }
      });
      setAnchors((previous) => (sameAnchors(previous, next) ? previous : next));
    };

    collect();
    const unregister = editor.registerUpdateListener(() => {
      collect();
    });
    window.addEventListener("resize", collect);
    return () => {
      unregister();
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
          className="pointer-events-auto absolute top-[var(--code-lang-top)] right-[var(--code-lang-right)]"
          data-code-language={anchor.key}
          key={anchor.key}
          style={
            {
              "--code-lang-right": `${anchor.right}px`,
              "--code-lang-top": `${anchor.top}px`,
            } as CSSProperties
          }
        >
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
