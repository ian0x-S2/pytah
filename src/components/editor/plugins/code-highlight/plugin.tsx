"use client";

import { $isCodeNode, CodeNode } from "@lexical/code";
import { registerCodeHighlighting } from "@lexical/code-shiki";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $isElementNode, type LexicalNode } from "lexical";
import { useEffect } from "react";
import { useTheme } from "@/components/theme-context";

const CODE_BLOCK_THEME_BY_MODE = {
  dark: "github-dark",
  light: "github-light",
} as const;

export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  const { resolvedTheme } = useTheme();
  const codeBlockTheme = CODE_BLOCK_THEME_BY_MODE[resolvedTheme];

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  useEffect(() => {
    return editor.registerNodeTransform(CodeNode, (codeNode) => {
      if (codeNode.getTheme() !== codeBlockTheme) {
        codeNode.setTheme(codeBlockTheme);
      }
    });
  }, [codeBlockTheme, editor]);

  useEffect(() => {
    editor.update(
      () => {
        const queue: LexicalNode[] = [$getRoot()];
        while (queue.length > 0) {
          const node = queue.shift();
          if (!node) {
            continue;
          }

          if ($isCodeNode(node) && node.getTheme() !== codeBlockTheme) {
            node.setTheme(codeBlockTheme);
          }

          if ($isElementNode(node)) {
            queue.push(...node.getChildren());
          }
        }
      },
      { discrete: true }
    );
  }, [codeBlockTheme, editor]);

  return null;
}
