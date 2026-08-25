import type { Transformer } from "@lexical/markdown";
import { createContext, useContext } from "react";

export const EditorTransformersContext = createContext<readonly Transformer[]>(
  []
);

export const useEditorTransformers = (): readonly Transformer[] => {
  return useContext(EditorTransformersContext);
};
