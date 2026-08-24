import type {
  ExcalidrawElement,
  NonDeleted,
} from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types";

export type ExcalidrawInitialElements = ExcalidrawInitialDataState["elements"];

/**
 * The subset of excalidraw state persisted inside an ExcalidrawNode. Only the
 * pieces needed to re-open and re-render a drawing are kept, mirroring what
 * the Lexical playground stores.
 */
export interface ExcalidrawScene {
  appState?: Partial<AppState>;
  elements: NonDeleted<ExcalidrawElement>[];
  files?: BinaryFiles;
}

/**
 * The live scene handed back by the excalidraw editor while drawing; element
 * lists are readonly and may be absent until the first change.
 */
export interface SaveableExcalidrawScene {
  appState?: Partial<AppState>;
  elements?: ExcalidrawInitialElements;
  files?: BinaryFiles;
}

const EMPTY_SCENE: ExcalidrawScene = { elements: [] };

export const EMPTY_SCENE_JSON = JSON.stringify(EMPTY_SCENE.elements);

export const serializeExcalidrawScene = (
  elements: ExcalidrawInitialElements,
  appState: Partial<AppState>,
  files: BinaryFiles
): string => {
  return JSON.stringify({ appState, elements, files });
};
export const parseExcalidrawScene = (data: string): ExcalidrawScene => {
  try {
    const parsed: unknown = JSON.parse(data);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as ExcalidrawScene).elements)
    ) {
      return EMPTY_SCENE;
    }

    const scene = parsed as ExcalidrawScene;
    return {
      appState: scene.appState,
      elements: scene.elements,
      files: scene.files ?? {},
    };
  } catch {
    return EMPTY_SCENE;
  }
};

export const hasExcalidrawContent = (
  scene: ExcalidrawScene | SaveableExcalidrawScene
): boolean => {
  const elements = scene.elements ?? [];
  return (
    elements.some((element) => !element.isDeleted) ||
    Object.keys(scene.files ?? {}).length > 0
  );
};
