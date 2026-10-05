"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

import { registerCodeSelectAll } from "./select-all";

export function CodeSelectAllPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerCodeSelectAll(editor), [editor]);

  return null;
}
