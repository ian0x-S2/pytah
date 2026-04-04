import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  sliceSource,
} from "@/components/docs/primitives";
import editorTypesSource from "@/components/editor/core/types.ts?raw";
import indexCssSource from "@/index.css?raw";
import demoPageSource from "@/pages/demo.tsx?raw";

const editorUsageExample = sliceSource(demoPageSource, {
  end: "          <Editor editable={editable} minimal toolbar={toolbar} />",
  start: 'import { Editor } from "@/components/editor/editor";',
});

const editorPropsSource = sliceSource(editorTypesSource, {
  end: "}",
  start: "export interface EditorProps {",
});

const highlightTokensSource = sliceSource(indexCssSource, {
  end: "  --highlight-foreground: oklch(0.145 0 0);",
  start: "  --highlight: oklch(0.97 0.05 90);",
});

const darkHighlightTokensSource = sliceSource(indexCssSource, {
  end: "  --highlight-foreground: oklch(0.985 0 0);",
  start: "  --highlight: oklch(0.35 0.06 85);",
});

const tailwindThemeBridgeSource = sliceSource(indexCssSource, {
  end: "  --color-highlight-foreground: var(--highlight-foreground);",
  start: "  --color-highlight: var(--highlight);",
});

export function GettingStartedPage() {
  return (
    <>
      <PageHeader
        badge="Core Doc"
        description="Add the Pytah editor to any React + shadcn/ui project via copy-paste. No package registry required."
        title="Getting Started"
      />

      <SectionHeading id="prerequisites">Prerequisites</SectionHeading>
      <Paragraph>
        Your project needs <code>React 19+</code>, <code>Tailwind CSS v4</code>,
        and <code>shadcn/ui</code> (base-nova style) already configured. The
        editor is built on <code>@base-ui/react</code> primitives, not Radix UI.
      </Paragraph>

      <SectionHeading id="install-dependencies">
        1. Install Dependencies
      </SectionHeading>
      <Paragraph>
        Install the Lexical editor framework and its companion packages:
      </Paragraph>
      <CodeBlock language="bash">
        {`bun add lexical @lexical/react @lexical/rich-text @lexical/list \\
  @lexical/code @lexical/link @lexical/table @lexical/html \\
  @lexical/markdown @lexical/utils @lexical/selection \\
  @lexical/clipboard @lexical/history @lexical/extension`}
      </CodeBlock>
      <Paragraph>
        Install the UI dependencies (skip any you already have):
      </Paragraph>
      <CodeBlock language="bash">
        {`bun add @base-ui/react class-variance-authority clsx \\
  tailwind-merge cmdk lucide-react`}
      </CodeBlock>

      <SectionHeading id="copy-files">2. Copy Files</SectionHeading>
      <Paragraph>
        Copy these directories and files into your project, preserving their
        relative paths:
      </Paragraph>
      <CodeBlock language="text">
        {`src/
├── components/
│   ├── editor/          ← entire directory (core + plugins + ui)
│   └── ui/              ← ShadCN primitives used by the editor:
│       ├── button.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── input-group.tsx
│       ├── popover.tsx
│       ├── separator.tsx
│       ├── textarea.tsx
│       └── toggle.tsx
└── lib/
    └── utils.ts         ← cn() helper`}
      </CodeBlock>

      <Callout title="Path alias required" variant="warning">
        The editor imports use the <code>@/</code> path alias (mapped to{" "}
        <code>./src</code>). Make sure your <code>tsconfig.json</code> and
        bundler are configured with this alias, or rewrite the imports.
      </Callout>

      <SectionHeading id="add-tokens">3. Add CSS Tokens</SectionHeading>
      <Paragraph>
        The editor uses two custom design tokens not in the default ShadCN
        palette. Add these to your CSS <code>:root</code> and <code>.dark</code>{" "}
        blocks:
      </Paragraph>
      <CodeBlock language="css">
        {`:root {
${highlightTokensSource}
}

.dark {
${darkHighlightTokensSource}
}`}
      </CodeBlock>
      <Paragraph>
        Then register them in your Tailwind v4 <code>@theme inline</code> block:
      </Paragraph>
      <CodeBlock language="css">
        {`@theme inline {
${tailwindThemeBridgeSource}
}`}
      </CodeBlock>

      <SectionHeading id="render">4. Render the Editor</SectionHeading>
      <Paragraph>
        The demo page is the smallest real integration in this repository. It
        toggles edit mode and mounts the editor in minimal mode:
      </Paragraph>
      <CodeBlock language="tsx">{editorUsageExample}</CodeBlock>

      <SubHeading id="composition">Composition First</SubHeading>
      <Paragraph>
        The default <code>Editor</code> is intentionally ready-made, but it now
        also exposes lego-like extension points so consumers can disable chrome,
        replace surfaces, add plugins, and register custom Lexical nodes without
        editing the internal editor files.
      </Paragraph>
      <CodeBlock language="tsx">
        {`import { Editor } from "@/components/editor/editor";
import { MyAnalyticsPlugin } from "@/components/editor/plugins/my-analytics/plugin";
import { MyCalloutNode } from "@/components/editor/core/nodes/my-callout/node";

export function CustomEditorExample() {
  return (
    <Editor
      chrome={{ header: false, outputs: false }}
      extraNodes={[MyCalloutNode]}
      features={{ floatingToolbar: false, slashCommand: true }}
      pluginSlots={{
        afterEditable: <MyAnalyticsPlugin />,
      }}
      slots={{
        actionBar: ({ onReset }) => (
          <button onClick={onReset} type="button">
            Reset document
          </button>
        ),
      }}
      toolbar="full"
    />
  );
}`}
      </CodeBlock>

      <SubHeading id="props">Editor Props</SubHeading>
      <Paragraph>
        The <code>Editor</code> component accepts the following props:
      </Paragraph>
      <CodeBlock language="typescript">{editorPropsSource}</CodeBlock>

      <Paragraph>The most important composition hooks are:</Paragraph>
      <CodeBlock language="tsx">
        {`features    // enable/disable built-in behavior plugins
chrome      // show/hide default shell/header/footer/action bar/output panels
slots       // replace default visual surfaces
pluginSlots // mount extra plugins around the built-in plugin stack
extraNodes  // register additional Lexical nodes
namespace   // customize the Lexical namespace when embedding multiple editors`}
      </CodeBlock>

      <Paragraph>
        For a deeper breakdown of those contracts, continue with the
        <code>Composition</code> and <code>API</code> pages.
      </Paragraph>

      <Callout title="That's it" variant="tip">
        The editor is self-contained. It manages its own Lexical composer,
        plugins, and toolbar by default, while still exposing public extension
        points when you need a more custom composition. No providers or context
        wrappers are needed beyond what React and your CSS already provide.
      </Callout>
    </>
  );
}
