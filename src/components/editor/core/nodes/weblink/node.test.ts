import { strictEqual } from "node:assert/strict";
import { after, describe, test } from "node:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof window === "undefined") {
  GlobalRegistrator.register();
}

after(() => {
  if (typeof window !== "undefined") {
    GlobalRegistrator.unregister();
  }
});

const { createEditor } = await import("lexical");

const { $createWeblinkNode, $isWeblinkNode, WeblinkNode } =
  await import("./node");
const { resolveWeblinkMetadata } = await import("./utils");

describe("WeblinkNode", () => {
  test("creates a WeblinkNode with default inline format", () => {
    const editor = createEditor({
      nodes: [WeblinkNode],
    });

    editor.update(() => {
      const node = $createWeblinkNode({
        url: "https://www.react.doctor/blog/intro",
      });
      strictEqual($isWeblinkNode(node), true);
      strictEqual(node.getUrl(), "https://www.react.doctor/blog/intro");
      strictEqual(node.getFormat(), "inline");
      strictEqual(node.isInline(), true);
      strictEqual(node.getTitle().toLowerCase().includes("intro"), true);
      strictEqual(node.getIcon()?.includes("react.doctor"), true);
    });
  });

  test("creates a WeblinkNode with small card format", () => {
    const editor = createEditor({
      nodes: [WeblinkNode],
    });

    editor.update(() => {
      const node = $createWeblinkNode({
        format: "small",
        title: "React Doctor",
        url: "https://www.react.doctor",
      });
      strictEqual(node.getFormat(), "small");
      strictEqual(node.isInline(), false);
      strictEqual(node.getTitle(), "React Doctor");
    });
  });

  test("updates format via setter", () => {
    const editor = createEditor({
      nodes: [WeblinkNode],
    });

    editor.update(() => {
      const node = $createWeblinkNode({
        format: "inline",
        url: "https://www.react.doctor",
      });
      node.setFormat("wide");
      strictEqual(node.getFormat(), "wide");
      strictEqual(node.isInline(), false);
    });
  });

  test("clones node state accurately", () => {
    const editor = createEditor({
      nodes: [WeblinkNode],
    });

    editor.update(() => {
      const original = $createWeblinkNode({
        description: "Diagnose React apps",
        format: "wide",
        icon: "https://icon.png",
        image: "https://image.png",
        title: "React Doctor",
        url: "https://www.react.doctor",
      });
      const clone = WeblinkNode.clone(original);
      strictEqual(clone.getUrl(), "https://www.react.doctor");
      strictEqual(clone.getTitle(), "React Doctor");
      strictEqual(clone.getDescription(), "Diagnose React apps");
      strictEqual(clone.getFormat(), "wide");
      strictEqual(clone.getIcon(), "https://icon.png");
      strictEqual(clone.getImage(), "https://image.png");
    });
  });

  test("serializes and deserializes JSON correctly", () => {
    const editor = createEditor({
      nodes: [WeblinkNode],
    });

    editor.update(() => {
      const node = $createWeblinkNode({
        description: "Test description",
        format: "small",
        title: "Test Title",
        url: "https://example.com",
      });
      const json = node.exportJSON();
      strictEqual(json.type, "weblink");
      strictEqual(json.url, "https://example.com");
      strictEqual(json.format, "small");
      strictEqual(json.title, "Test Title");

      const imported = WeblinkNode.importJSON(json);
      strictEqual($isWeblinkNode(imported), true);
      strictEqual(imported.getUrl(), "https://example.com");
      strictEqual(imported.getFormat(), "small");
      strictEqual(imported.getTitle(), "Test Title");
    });
  });

  test("exports and imports DOM with data-lexical-weblink", () => {
    const editor = createEditor({
      nodes: [WeblinkNode],
    });

    editor.update(() => {
      const node = $createWeblinkNode({
        format: "small",
        title: "React Doctor",
        url: "https://www.react.doctor",
      });
      const { element } = node.exportDOM();
      strictEqual(element instanceof HTMLElement, true);
      if (element instanceof HTMLElement) {
        strictEqual(element.dataset.lexicalWeblink, "true");
        strictEqual(element.dataset.format, "small");
        strictEqual(element.dataset.url, "https://www.react.doctor");
      }
    });
  });

  test("resolveWeblinkMetadata handles complex URLs", () => {
    const meta = resolveWeblinkMetadata(
      "https://sub.domain.com/awesome-guide.html"
    );
    strictEqual(meta.url, "https://sub.domain.com/awesome-guide.html");
    strictEqual(meta.title, "Awesome guide");
    strictEqual(meta.icon?.includes("sub.domain.com"), true);
  });
});
