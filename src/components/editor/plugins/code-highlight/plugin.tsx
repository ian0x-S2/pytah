"use client";

import { CodeNode } from "@lexical/code";
import { registerCodeHighlighting } from "@lexical/code-shiki";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $nodesOfType } from "lexical";
import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

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
        for (const codeNode of $nodesOfType(CodeNode)) {
          if (codeNode.getTheme() !== codeBlockTheme) {
            codeNode.setTheme(codeBlockTheme);
          }
        }
      },
      { discrete: true }
    );
  }, [codeBlockTheme, editor]);

  return null;
}
