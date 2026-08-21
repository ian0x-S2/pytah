import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from "@lexical/extension";
import { createHeadlessEditor } from "@lexical/headless";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import type { ElementTransformer } from "@lexical/markdown";
import { $convertFromMarkdownString } from "@lexical/markdown";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  type ElementNode,
  UNDO_COMMAND,
} from "lexical";
import { DEFAULT_EDITOR_FEATURES } from "../../core/composition";
import { createEditorConfig } from "../../core/config";
import { resolveFeatureNodes } from "../../core/features";
import {
  $replaceWithHorizontalRule,
  BUILTIN_MARKDOWN_TRANSFORMERS,
  EDITOR_MARKDOWN_TRANSFORMERS,
  HORIZONTAL_RULE_MARKDOWN_TRANSFORMER,
} from "./transformers";

const createTestEditor = () => {
  const config = createEditorConfig({
    editable: true,
    featureNodes: resolveFeatureNodes(DEFAULT_EDITOR_FEATURES),
  });
  return createHeadlessEditor({
    editable: config.editable,
    namespace: config.namespace,
    nodes: config.nodes,
    onError: (error) => {
      throw error;
    },
    theme: config.theme,
  });
};

const hrTransformer = () =>
  HORIZONTAL_RULE_MARKDOWN_TRANSFORMER as ElementTransformer;

const hierarchy = (editor: ReturnType<typeof createTestEditor>) => {
  let result = "";
  editor.getEditorState().read(() => {
    result = $getRoot()
      .getChildren()
      .map((child) => `${child.getType()}:${child.getTextContent()}`)
      .join("|");
  });
  return result;
};

describe("Horizontal rule markdown transformer", () => {
  test("is part of the always-on transformer set", () => {
    strictEqual(
      BUILTIN_MARKDOWN_TRANSFORMERS.includes(
        HORIZONTAL_RULE_MARKDOWN_TRANSFORMER
      ),
      true
    );
    strictEqual(
      EDITOR_MARKDOWN_TRANSFORMERS.includes(
        HORIZONTAL_RULE_MARKDOWN_TRANSFORMER
      ),
      true
    );
  });

  test("exports a horizontal rule node to a divider", async () => {
    const editor = createTestEditor();
    let result = "";
    await editor.update(() => {
      const node = $createHorizontalRuleNode();
      result = hrTransformer().export?.(node, () => "") as string;
    });
    strictEqual(result, "---");
  });

  test("only matches a bare triple dash with an optional trailing space", () => {
    const { regExp } = hrTransformer();
    strictEqual(regExp.test("---"), true);
    strictEqual(regExp.test("--- "), true);
    strictEqual(regExp.test("texto ---"), false);
    strictEqual(regExp.test("----"), false);
    strictEqual(regExp.test("---- "), false);
    strictEqual(regExp.test("---  "), false);
    strictEqual(regExp.test("---x"), false);
    strictEqual(regExp.test(" ---"), false);
  });

  test("imports a bare divider line into a horizontal rule node", async () => {
    const editor = createTestEditor();
    await editor.update(() => {
      $convertFromMarkdownString("---", [...EDITOR_MARKDOWN_TRANSFORMERS]);
    });
    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual(children.length, 1);
      strictEqual($isHorizontalRuleNode(children[0]), true);
    });
  });

  test("keeps surrounding text untouched on import", async () => {
    const editor = createTestEditor();
    await editor.update(() => {
      $convertFromMarkdownString("texto ---\n\n----", [
        ...EDITOR_MARKDOWN_TRANSFORMERS,
      ]);
    });
    strictEqual(hierarchy(editor).includes("horizontalrule:"), false);
  });

  test("inserts a selectable paragraph after the rule on a shortcut", async () => {
    const editor = createTestEditor();
    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("---"));
      root.append(paragraph);

      $replaceWithHorizontalRule(paragraph, true);
    });
    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual(children.length, 2);
      strictEqual($isHorizontalRuleNode(children[0]), true);
      strictEqual($isParagraphNode(children[1]), true);
      strictEqual(children[1]?.getTextContent(), "");
    });
  });

  test("does not add a trailing paragraph on import", async () => {
    const editor = createTestEditor();
    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("---"));
      root.append(paragraph);

      $replaceWithHorizontalRule(paragraph, false);
    });
    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual(children.length, 1);
      strictEqual($isHorizontalRuleNode(children[0]), true);
    });
  });

  test("undo restores the source paragraph", async () => {
    const editor = createTestEditor();
    let tick = 0;
    const dateNow = () => (tick += 1000);
    registerHistory(editor, createEmptyHistoryState(), 100, dateNow);

    await editor.update(() => {
      const root = $getRoot();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("---"));
      root.append(paragraph);
    });

    await editor.update(() => {
      const firstChild = $getRoot().getFirstChild();
      if (!firstChild) {
        return;
      }
      $replaceWithHorizontalRule(firstChild as ElementNode, true);
    });

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual(children.length, 2);
      strictEqual($isHorizontalRuleNode(children[0]), true);
      strictEqual($isParagraphNode(children[1]), true);
    });

    editor.dispatchCommand(UNDO_COMMAND, undefined);
    await editor.update(() => {
      // Flush the history restore before reading the editor state.
    });

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      strictEqual(children.length, 1);
      strictEqual($isParagraphNode(children[0]), true);
      strictEqual(children[0]?.getTextContent(), "---");
    });
  });
});
