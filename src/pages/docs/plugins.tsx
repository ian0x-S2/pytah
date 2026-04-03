import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";
import editorContentSource from "@/components/editor/ui/content.tsx?raw";

export function PluginsPage() {
  return (
    <>
      <PageHeader
        description="The editor's feature set is built as composable Lexical plugins."
        title="Plugins"
      />

      <SectionHeading id="overview">Overview</SectionHeading>
      <Paragraph>
        Every editor feature is implemented as a Lexical plugin -- a React
        component rendered inside the <code>LexicalComposer</code> context.
        Plugins are either <strong>visual</strong> (render UI like toolbars and
        menus) or <strong>headless</strong> (register commands and transforms,
        return <code>null</code>).
      </Paragraph>

      <SectionHeading id="live-orchestration">
        Live Plugin Orchestration
      </SectionHeading>
      <Paragraph>
        The plugin list below is the actual composition root from
        <code>src/components/editor/ui/content.tsx</code>. It is a better source
        of truth than a copied list because it shows the exact registration
        order running in the app.
      </Paragraph>
      <CodeBlock language="src/components/editor/ui/content.tsx">
        {editorContentSource}
      </CodeBlock>

      <SectionHeading id="visual-plugins">Visual Plugins</SectionHeading>
      <Table headers={["Plugin", "Description", "UI Components Used"]}>
        <TableRow>
          <TableCell>
            <strong>block-type-toolbar</strong>
          </TableCell>
          <TableCell>
            Block type dropdown (paragraph, headings, lists, code, quote) with
            undo/redo and alignment controls
          </TableCell>
          <TableCell>Button, Popover, Separator</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>floating-toolbar</strong>
          </TableCell>
          <TableCell>
            Appears on text selection with format toggles (bold, italic,
            underline, strikethrough, code, highlight, link)
          </TableCell>
          <TableCell>Toggle, Separator</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>slash-command</strong>
          </TableCell>
          <TableCell>
            Slash menu (type /) for inserting blocks, images, tables, YouTube
            embeds, column layouts, and collapsible sections
          </TableCell>
          <TableCell>Command, Dialog, Button, Input, Textarea</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>link-behavior</strong>
          </TableCell>
          <TableCell>
            Auto-link detection, clickable links, and a floating link editor for
            viewing/editing URLs
          </TableCell>
          <TableCell>Button, Input</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>table-behavior</strong>
          </TableCell>
          <TableCell>
            Context menu on table cells with insert/delete row/column/table
            actions
          </TableCell>
          <TableCell>Button, Popover, Separator</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>draggable-block</strong>
          </TableCell>
          <TableCell>
            Drag handle that appears on hover to reorder blocks via
            drag-and-drop
          </TableCell>
          <TableCell>None (DOM-level handles)</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>image</strong>
          </TableCell>
          <TableCell>
            Image rendering with selection ring, alignment support, and resize
            handles
          </TableCell>
          <TableCell>None (custom DOM)</TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="headless-plugins">Headless Plugins</SectionHeading>
      <Table headers={["Plugin", "Description"]}>
        <TableRow>
          <TableCell>
            <strong>core/editable</strong>
          </TableCell>
          <TableCell>
            Syncs the editable prop to the Lexical editor instance
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/editor-state</strong>
          </TableCell>
          <TableCell>
            Fires onChange callbacks and handles initial content loading (HTML
            or Markdown)
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/focus-on-mount</strong>
          </TableCell>
          <TableCell>Focuses the editor on first mount</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/horizontal-rule</strong>
          </TableCell>
          <TableCell>
            Horizontal rule insertion, click selection, and keyboard navigation
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>core/seed-content</strong>
          </TableCell>
          <TableCell>
            Seeds default Markdown content when the editor starts empty
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>collapsible</strong>
          </TableCell>
          <TableCell>
            Collapsible block node transforms and keyboard shortcuts
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>layout</strong>
          </TableCell>
          <TableCell>Column layout insert command registration</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>youtube</strong>
          </TableCell>
          <TableCell>YouTube embed insert command and URL parsing</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>markdown</strong>
          </TableCell>
          <TableCell>
            Custom Markdown transformers for images, YouTube embeds, and tables
          </TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="adding-plugins">
        Adding a Custom Plugin
      </SectionHeading>
      <Paragraph>
        Every plugin follows the same pattern: a React component that accesses
        the editor through <code>useLexicalComposerContext()</code>, registers
        its behavior in a <code>useEffect</code>, and either returns{" "}
        <code>null</code> (headless) or renders UI (visual). The steps below
        walk you through adding a new headless plugin from scratch.
      </Paragraph>

      <SubHeading>Step 1 — Create the plugin file</SubHeading>
      <Paragraph>
        Create <code>src/components/editor/plugins/my-feature/plugin.tsx</code>.
        Define a Lexical command and register a handler for it inside{" "}
        <code>useEffect</code>. The return value of <code>registerCommand</code>{" "}
        is an unsubscribe function — returning it from <code>useEffect</code>{" "}
        cleans up automatically when the component unmounts.
      </Paragraph>
      <CodeBlock language="tsx">
        {`// src/components/editor/plugins/my-feature/plugin.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { useEffect } from "react";

export const MY_COMMAND = createCommand<void>("MY_COMMAND");

export function MyPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      MY_COMMAND,
      () => {
        editor.update(() => {
          // mutate the Lexical state here
        });
        return true; // true = command was handled, stop propagation
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}`}
      </CodeBlock>

      <Callout variant="tip">
        If your plugin renders UI (a toolbar button, a popover, etc.), return
        JSX instead of <code>null</code> and import the ShadCN primitives from{" "}
        <code>@/components/ui/</code>. Dispatch commands to the editor with{" "}
        <code>editor.dispatchCommand(MY_COMMAND, payload)</code>.
      </Callout>

      <SubHeading>Step 2 — Register the plugin in content.tsx</SubHeading>
      <Paragraph>
        Open <code>src/components/editor/ui/content.tsx</code> and add your
        plugin. Import it alongside the other plugins and drop the component
        inside <code>EditorContent</code>.
      </Paragraph>
      <CodeBlock language="tsx">
        {`// 1. Add the import near the other plugin imports
import { MyPlugin } from "../plugins/my-feature/plugin";

// 2. Add the component inside EditorContent, next to the other plugins
// Conditionally render inside the editable block if the plugin
// is only relevant in edit mode:
{editable ? (
  <>
    {/* ...existing editable-only plugins */}
    <MyPlugin />
  </>
) : null}

// Or unconditionally if it should run in read-only mode too:
<MyPlugin />`}
      </CodeBlock>

      <SubHeading>Step 3 — Add a custom node (optional)</SubHeading>
      <Paragraph>
        If your feature needs a custom Lexical node (e.g., a decorator for
        rendering React UI inside the editor), create it under{" "}
        <code>src/components/editor/core/nodes/my-feature/node.tsx</code>.
        Export the class plus the standard <code>$create</code> and{" "}
        <code>$is</code> helpers that Lexical convention expects.
      </Paragraph>
      <CodeBlock language="tsx">
        {`// src/components/editor/core/nodes/my-feature/node.tsx
import {
  $applyNodeReplacement,
  DecoratorNode,
  type LexicalNode,
} from "lexical";

export class MyFeatureNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return "my-feature";
  }

  static clone(node: MyFeatureNode): MyFeatureNode {
    return new MyFeatureNode(node.__key);
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <div>Your rendered UI here</div>;
  }
}

export function $createMyFeatureNode(): MyFeatureNode {
  return $applyNodeReplacement(new MyFeatureNode());
}

export function $isMyFeatureNode(
  node: LexicalNode | null | undefined
): node is MyFeatureNode {
  return node instanceof MyFeatureNode;
}`}
      </CodeBlock>

      <SubHeading>
        Step 4 — Register the node in config.ts (optional)
      </SubHeading>
      <Paragraph>
        Custom nodes must be declared in the editor config before Lexical can
        serialize or deserialize them. Open{" "}
        <code>src/components/editor/core/config.ts</code> and add your node to{" "}
        the <code>EDITOR_NODES</code> array.
      </Paragraph>
      <CodeBlock language="ts">
        {`// src/components/editor/core/config.ts
import { MyFeatureNode } from "./nodes/my-feature/node"; // ← add import

const EDITOR_NODES = [
  // ...existing nodes
  MyFeatureNode, // ← add here
];`}
      </CodeBlock>

      <Callout variant="tip">
        Keep <code>types.ts</code>, <code>commands.ts</code>, and{" "}
        <code>utils.ts</code> co-located inside <code>plugins/my-feature/</code>{" "}
        so the feature is self-contained and easy to remove.
      </Callout>

      <SectionHeading id="extending-slash-command">
        Extending the Slash Command Menu
      </SectionHeading>
      <Paragraph>
        The slash command menu is driven by three files in{" "}
        <code>plugins/slash-command/</code>. Adding a new command is a
        three-step change — no plugin.tsx edits required for simple block
        insertions.
      </Paragraph>

      <Table headers={["File", "What you add"]}>
        <TableRow>
          <TableCell>
            <code>types.ts</code>
          </TableCell>
          <TableCell>A new literal to the SlashCommandId union</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>commands.ts</code>
          </TableCell>
          <TableCell>
            A SlashCommand object (label, description, icon, keywords)
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <code>executors.ts</code>
          </TableCell>
          <TableCell>
            A Lexical mutation function keyed by your new ID
          </TableCell>
        </TableRow>
      </Table>

      <SubHeading>Step 1 — Register the command ID</SubHeading>
      <Paragraph>
        Open <code>plugins/slash-command/types.ts</code> and add your new
        identifier to the <code>SlashCommandId</code> union. TypeScript will
        then enforce that the other two files are updated to match.
      </Paragraph>
      <CodeBlock language="ts">
        {`// src/components/editor/plugins/slash-command/types.ts
export type SlashCommandId =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "code"
  | "bullet"
  | "number"
  | "check"
  | "image"
  | "youtube"
  | "collapsible"
  | "columns"
  | "table"
  | "hr"
  | "callout"; // ← add your ID here`}
      </CodeBlock>

      <SubHeading>Step 2 — Add the command definition</SubHeading>
      <Paragraph>
        Open <code>plugins/slash-command/commands.ts</code> and push a new entry
        into the <code>SLASH_COMMANDS</code> array. Pick a{" "}
        <code>lucide-react</code> icon, write a short <code>description</code>,
        and add <code>keywords</code> so the fuzzy filter can find your command
        even when the user doesn't type the exact label.
      </Paragraph>
      <CodeBlock language="ts">
        {`// src/components/editor/plugins/slash-command/commands.ts
import { AlertCircleIcon } from "lucide-react"; // ← add icon import

export const SLASH_COMMANDS: SlashCommand[] = [
  // ...existing commands
  {
    description: "Highlighted callout block",
    icon: AlertCircleIcon,
    id: "callout",
    keywords: ["callout", "note", "info", "alert", "warning"],
    label: "Callout",
  },
];`}
      </CodeBlock>

      <SubHeading>Step 3 — Add the executor</SubHeading>
      <Paragraph>
        Open <code>plugins/slash-command/executors.ts</code> and add an entry to
        the <code>SLASH_COMMAND_EXECUTORS</code> map. The function receives the
        top-level <code>ElementNode</code> where the slash text lives and should
        replace or transform it into your target block.
      </Paragraph>
      <CodeBlock language="ts">
        {`// src/components/editor/plugins/slash-command/executors.ts
import { $createParagraphNode } from "lexical"; // already imported

export const SLASH_COMMAND_EXECUTORS: Record<
  SlashCommandId,
  (element: ElementNode) => void
> = {
  // ...existing entries
  callout: (element) => {
    const paragraph = $createParagraphNode();
    element.replace(paragraph);
    paragraph.selectEnd();
  },
};`}
      </CodeBlock>

      <Callout title="Commands that need user input" variant="info">
        If your command requires extra data before inserting (a URL, a file, a
        preset choice), intercept it in <code>plugin.tsx</code> before the
        executor runs: capture the <code>targetNodeKey</code> from the current
        selection, store it in state, and open a dialog. The existing{" "}
        <code>image</code>, <code>youtube</code>, and <code>columns</code>{" "}
        commands follow this pattern and are good reference implementations.
      </Callout>
    </>
  );
}
