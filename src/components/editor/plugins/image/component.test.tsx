import { strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { LexicalEditor } from "lexical";

// DOM globals must exist before React and Lexical evaluate their CAN_USE_DOM
// checks, so this file registers happy-dom up front and imports the
// browser-dependent modules dynamically afterwards.
GlobalRegistrator.register();
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement, useEffect, useState } = await import("react");
const { createRoot } = await import("react-dom/client");
const { LexicalComposer } = await import("@lexical/react/LexicalComposer");
const { useLexicalComposerContext } =
  await import("@lexical/react/LexicalComposerContext");
const { $createNodeSelection, $getRoot, $selectAll, $setSelection } =
  await import("lexical");
const { $createImageNode, ImageNode } =
  await import("../../core/nodes/image/node");
const { ImageComponent } = await import("./component");

const IMAGE_SRC = "https://example.com/image.png";

let editorRef: LexicalEditor | null = null;
let rootRef: ReturnType<typeof createRoot> | null = null;
let containerRef: HTMLElement | null = null;

after(async () => {
  await act(() => {
    rootRef?.unmount();
  });
  GlobalRegistrator.unregister();
});

// Renders the component bound to the seeded image node's key. The composer
// applies a function `editorState` in a microtask, so the key is read from the
// first commit that populates the root.
const ImageHarness = () => {
  const [editor] = useLexicalComposerContext();
  const [nodeKey, setNodeKey] = useState<string | null>(null);

  useEffect(() => {
    editorRef = editor;

    const readNodeKey = () => {
      setNodeKey(
        editor.getEditorState().read(() => {
          const image = $getRoot().getFirstChild();
          return image === null ? null : image.getKey();
        })
      );
    };

    readNodeKey();
    return editor.registerUpdateListener(readNodeKey);
  }, [editor]);

  if (nodeKey === null) {
    return null;
  }

  return createElement(ImageComponent, {
    alignment: "left",
    altText: "",
    height: "inherit",
    nodeKey,
    src: IMAGE_SRC,
    width: "inherit",
  });
};

const renderImageComponent = async (): Promise<void> => {
  containerRef = document.createElement("div");
  document.body.append(containerRef);
  rootRef = createRoot(containerRef);

  await act(async () => {
    rootRef?.render(
      createElement(
        LexicalComposer,
        {
          initialConfig: {
            editable: true,
            editorState: () => {
              $getRoot().append(
                $createImageNode({ altText: "", src: IMAGE_SRC })
              );
            },
            namespace: "image-component-test",
            nodes: [ImageNode],
            onError: (error: Error) => {
              throw error;
            },
          },
        },
        createElement(ImageHarness)
      )
    );
    await new Promise<void>((resolve) => {
      queueMicrotask(resolve);
    });
  });
};

// Lexical commits updates in a microtask; act must wait for the commit so the
// update listeners (and the state they set) have run before assertions.
const runEditorUpdate = async (update: () => void): Promise<void> => {
  await act(async () => {
    editorRef?.update(update);
    await new Promise<void>((resolve) => {
      queueMicrotask(resolve);
    });
  });
};

const countHandles = (): number =>
  containerRef?.querySelectorAll(".editor-resize-handle").length ?? 0;

describe("ImageComponent resize handles", () => {
  test("mounts the handles when the image is node-selected after a select-all", async () => {
    await renderImageComponent();
    strictEqual(countHandles(), 0);

    // A document-wide range selection contains the image: Lexical reports the
    // node as selected, but the resize chrome must stay unmounted.
    await runEditorUpdate(() => {
      $selectAll();
    });
    strictEqual(countHandles(), 0);

    // Clicking the image replaces the range with its own NodeSelection. The
    // handles must mount even though `node.isSelected()` never changed.
    await runEditorUpdate(() => {
      const selection = $createNodeSelection();
      selection.add($getRoot().getFirstChildOrThrow().getKey());
      $setSelection(selection);
    });
    strictEqual(countHandles(), 4);

    // Dropping the node selection takes the chrome away again.
    await runEditorUpdate(() => {
      $setSelection(null);
    });
    strictEqual(countHandles(), 0);
  });
});
