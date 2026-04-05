import {
  Callout,
  CodeBlock,
  FileTree,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";
import slashCommandCommandsSource from "@/components/editor/plugins/slash-command/commands.ts?raw";
import slashCommandExecutorsSource from "@/components/editor/plugins/slash-command/executors.ts?raw";
import slashCommandTypesSource from "@/components/editor/plugins/slash-command/types.ts?raw";
import slashCommandUtilsSource from "@/components/editor/plugins/slash-command/utils.ts?raw";

export function SlashCommandGuidePage() {
  return (
    <>
      <PageHeader
        badge="Extension Guide"
        description="Extension guide for the slash-command system: registry, filtering, executors, and how to add new command-driven insertion flows."
        title="Slash Command"
      />

      <Callout title="Extension guide" variant="info">
        This guide is primarily about extending a command-driven insertion
        surface. For the higher-level composition API, start with the
        <code>Composition</code> and <code>API</code> pages.
      </Callout>

      <SectionHeading id="files">Files</SectionHeading>
      <FileTree
        items={[
          "src/components/editor/plugins/slash-command/",
          "  types.ts       ← SlashCommand shape + SlashCommandId union",
          "  commands.ts    ← SLASH_COMMANDS registry + SLASH_COMMAND_PATTERN",
          "  utils.ts       ← filter, navigation, query-match helpers",
          "  executors.ts   ← maps each SlashCommandId → Lexical mutation",
          "  plugin.tsx     ← SlashCommandPlugin (menu UI + keyboard wiring)",
        ]}
      />

      <SectionHeading id="types">types.ts</SectionHeading>
      <Paragraph>
        The <code>SlashCommandId</code> union is the single source of truth for
        every supported command. The docs below render the actual source files,
        so the page stays aligned with the implementation.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/slash-command/types.ts"
        language="ts"
      >
        {slashCommandTypesSource}
      </CodeBlock>

      <SectionHeading id="commands">commands.ts</SectionHeading>
      <Paragraph>
        <code>SLASH_COMMANDS</code> is the ordered list rendered in the menu.
        Each entry's <code>keywords</code> array drives fuzzy filtering.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/slash-command/commands.ts"
        language="ts"
      >
        {slashCommandCommandsSource}
      </CodeBlock>

      <SectionHeading id="utils">utils.ts</SectionHeading>
      <Paragraph>
        Pure helper functions used by the plugin: filtering by query, navigating
        up/down, and extracting the slash query from the text immediately before
        the cursor.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/slash-command/utils.ts"
        language="ts"
      >
        {slashCommandUtilsSource}
      </CodeBlock>

      <SectionHeading id="executors">executors.ts</SectionHeading>
      <Paragraph>
        Maps every <code>SlashCommandId</code> to a function that mutates the
        Lexical tree. All functions receive the{" "}
        <em>current top-level element</em>
        that contains the cursor, and replace or transform it in-place.
      </Paragraph>
      <CodeBlock
        label="src/components/editor/plugins/slash-command/executors.ts"
        language="ts"
      >
        {slashCommandExecutorsSource}
      </CodeBlock>

      <SectionHeading id="extending">Adding a New Command</SectionHeading>
      <Paragraph>
        The flow is still the same: extend the ID union, add a command entry,
        and register the executor. The source blocks above are the canonical
        reference for the exact shapes currently in use.
      </Paragraph>

      <SubHeading>1. Extend the type union</SubHeading>
      <CodeBlock label="types.ts" language="ts">
        {`// types.ts -- add your id to SlashCommandId
export type SlashCommandId =
  | "paragraph"
  | "h1"
  | /* ... */
  | "my-command";`}
      </CodeBlock>

      <SubHeading>2. Add the menu entry</SubHeading>
      <CodeBlock label="commands.ts" language="ts">
        {`// commands.ts
import { MyIcon } from "lucide-react";

export const SLASH_COMMANDS: SlashCommand[] = [
  // ...existing entries...
  {
    description: "My custom block",
    icon: MyIcon,
    id: "my-command",
    keywords: ["custom", "my"],
    label: "My Block",
  },
];`}
      </CodeBlock>

      <SubHeading>3. Add the executor</SubHeading>
      <CodeBlock label="executors.ts" language="ts">
        {`// executors.ts
export const SLASH_COMMAND_EXECUTORS: Record<SlashCommandId, ...> = {
  // ...existing entries...
  "my-command": (element) => {
    const myNode = $createMyNode();
    element.replace(myNode);
    myNode.selectEnd();
  },
};`}
      </CodeBlock>

      <Callout title="image and youtube are stubs" variant="info">
        Both <code>image</code> and <code>youtube</code> map to{" "}
        <code>applyParagraphCommand</code> in the executors. The actual
        insertion is handled by a prompt dialog in the plugin's{" "}
        <code>handleExecute</code> function. The executor just normalizes the
        cursor position before the dialog opens.
      </Callout>
    </>
  );
}
