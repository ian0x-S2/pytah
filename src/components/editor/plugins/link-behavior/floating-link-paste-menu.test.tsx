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

const {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  createEditor,
  ParagraphNode,
  TextNode,
} = await import("lexical");
const { $createLinkNode, $isLinkNode, LinkNode } =
  await import("@lexical/link");

const { $createWeblinkNode, $isWeblinkNode, WeblinkNode } =
  await import("../../core/nodes/weblink/node");
const { LINK_PASTE_OPTIONS } = await import("./constants");
const { executeLinkPasteOption } =
  await import("./floating-link-paste-actions");

describe("FloatingLinkPasteMenu", () => {
  test("defines the 5 link paste options without embed", () => {
    strictEqual(LINK_PASTE_OPTIONS.length, 5);
    strictEqual(LINK_PASTE_OPTIONS[0].id, "inline-link");
    strictEqual(LINK_PASTE_OPTIONS[0].label, "Paste inline link");

    strictEqual(LINK_PASTE_OPTIONS[1].id, "inline-weblink");
    strictEqual(LINK_PASTE_OPTIONS[1].label, "Inline – Weblink");

    strictEqual(LINK_PASTE_OPTIONS[2].id, "small-weblink");
    strictEqual(LINK_PASTE_OPTIONS[2].label, "Small card – Weblink");

    strictEqual(LINK_PASTE_OPTIONS[3].id, "wide-weblink");
    strictEqual(LINK_PASTE_OPTIONS[3].label, "Wide card – Weblink");

    strictEqual(LINK_PASTE_OPTIONS[4].id, "remove-link");
    strictEqual(LINK_PASTE_OPTIONS[4].label, "Remove link");
  });

  test("converts link to inline WeblinkNode", () => {
    const editor = createEditor({
      nodes: [LinkNode, WeblinkNode, ParagraphNode, TextNode],
    });

    let linkKey = "";
    editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("https://www.react.doctor");
        const text = $createTextNode("https://www.react.doctor");
        link.append(text);
        paragraph.append(link);
        root.append(paragraph);
        linkKey = link.getKey();
      },
      { discrete: true }
    );

    // Execute inline weblink conversion
    editor.update(
      () => {
        const linkNode = $getNodeByKey(linkKey);
        strictEqual($isLinkNode(linkNode), true);
        if (linkNode) {
          const weblink = $createWeblinkNode({
            format: "inline",
            url: "https://www.react.doctor",
          });
          linkNode.replace(weblink);
          const textAfter = $createTextNode(" ");
          weblink.insertAfter(textAfter);
          textAfter.select();
        }
      },
      { discrete: true }
    );

    editor.read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      strictEqual($isElementNode(paragraph), true);
      if ($isElementNode(paragraph)) {
        const child = paragraph.getFirstChild();
        strictEqual($isWeblinkNode(child), true);
        if ($isWeblinkNode(child)) {
          strictEqual(child.getFormat(), "inline");
          strictEqual(child.isInline(), true);
          strictEqual(child.getUrl(), "https://www.react.doctor");
        }
      }
    });
  });

  test("converts standalone link to small card WeblinkNode replacing the paragraph block", () => {
    const editor = createEditor({
      nodes: [LinkNode, WeblinkNode, ParagraphNode, TextNode],
    });

    let linkKey = "";
    editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("https://www.react.doctor");
        const text = $createTextNode("https://www.react.doctor");
        link.append(text);
        paragraph.append(link);
        root.append(paragraph);
        linkKey = link.getKey();
      },
      { discrete: true }
    );

    // Execute small card conversion
    editor.update(
      () => {
        const linkNode = $getNodeByKey(linkKey);
        strictEqual($isLinkNode(linkNode), true);
        if (linkNode) {
          const weblink = $createWeblinkNode({
            format: "small",
            url: "https://www.react.doctor",
          });
          const parent = linkNode.getParent();
          if (
            parent &&
            $isParagraphNode(parent) &&
            parent.getTextContent().trim() === "https://www.react.doctor"
          ) {
            parent.replace(weblink);
          } else {
            linkNode.replace(weblink);
          }
          const trailing = $createParagraphNode();
          weblink.insertAfter(trailing);
          trailing.select();
        }
      },
      { discrete: true }
    );

    editor.read(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      strictEqual($isWeblinkNode(firstChild), true);
      if ($isWeblinkNode(firstChild)) {
        strictEqual(firstChild.getFormat(), "small");
        strictEqual(firstChild.isInline(), false);
        strictEqual(firstChild.getUrl(), "https://www.react.doctor");
      }
    });
  });

  test("converts standalone link to wide card WeblinkNode", () => {
    const editor = createEditor({
      nodes: [LinkNode, WeblinkNode, ParagraphNode, TextNode],
    });

    let linkKey = "";
    editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("https://www.react.doctor");
        const text = $createTextNode("https://www.react.doctor");
        link.append(text);
        paragraph.append(link);
        root.append(paragraph);
        linkKey = link.getKey();
      },
      { discrete: true }
    );

    editor.update(
      () => {
        const linkNode = $getNodeByKey(linkKey);
        if (linkNode) {
          const weblink = $createWeblinkNode({
            format: "wide",
            url: "https://www.react.doctor",
          });
          const parent = linkNode.getParent();
          if (parent && $isParagraphNode(parent)) {
            parent.replace(weblink);
          }
          const trailing = $createParagraphNode();
          weblink.insertAfter(trailing);
          trailing.select();
        }
      },
      { discrete: true }
    );

    editor.read(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      strictEqual($isWeblinkNode(firstChild), true);
      if ($isWeblinkNode(firstChild)) {
        strictEqual(firstChild.getFormat(), "wide");
        strictEqual(firstChild.isInline(), false);
      }
    });
  });

  test("removes link formatting leaving plain text node", () => {
    const editor = createEditor({
      nodes: [LinkNode, WeblinkNode, ParagraphNode, TextNode],
    });

    let linkKey = "";
    editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("https://www.react.doctor");
        const text = $createTextNode("https://www.react.doctor");
        link.append(text);
        paragraph.append(link);
        root.append(paragraph);
        linkKey = link.getKey();
      },
      { discrete: true }
    );

    editor.update(
      () => {
        const linkNode = $getNodeByKey(linkKey);
        if (linkNode) {
          const textNode = $createTextNode("https://www.react.doctor");
          linkNode.replace(textNode);
          textNode.selectEnd();
        }
      },
      { discrete: true }
    );

    editor.read(() => {
      const root = $getRoot();
      const paragraph = root.getFirstChild();
      strictEqual($isElementNode(paragraph), true);
      if ($isElementNode(paragraph)) {
        const child = paragraph.getFirstChild();
        strictEqual($isTextNode(child), true);
        strictEqual($isLinkNode(child), false);
        strictEqual(child?.getTextContent(), "https://www.react.doctor");
      }
    });
  });

  test("executeLinkPasteOption converts link to small weblink node", () => {
    const editor = createEditor({
      nodes: [LinkNode, WeblinkNode, ParagraphNode, TextNode],
    });

    let linkKey = "";
    editor.update(
      () => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const link = $createLinkNode("https://www.react.doctor");
        const text = $createTextNode("https://www.react.doctor");
        link.append(text);
        paragraph.append(link);
        root.append(paragraph);
        linkKey = link.getKey();
      },
      { discrete: true }
    );

    executeLinkPasteOption(
      editor,
      linkKey,
      "https://www.react.doctor",
      "small-weblink"
    );

    editor.read(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      strictEqual($isWeblinkNode(firstChild), true);
      if ($isWeblinkNode(firstChild)) {
        strictEqual(firstChild.getFormat(), "small");
      }
    });
  });
});
