import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";

export function GettingStartedPage() {
  return (
    <>
      <PageHeader
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
  /* ... your existing ShadCN tokens ... */
  --highlight: oklch(0.905 0.145 98);
  --highlight-foreground: oklch(0.145 0 0);
}

.dark {
  /* ... your existing ShadCN tokens ... */
  --highlight: oklch(0.65 0.13 85);
  --highlight-foreground: oklch(0.985 0 0);
}`}
      </CodeBlock>
      <Paragraph>
        Then register them in your Tailwind v4 <code>@theme inline</code> block:
      </Paragraph>
      <CodeBlock language="css">
        {`@theme inline {
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
}`}
      </CodeBlock>

      <SectionHeading id="render">4. Render the Editor</SectionHeading>
      <CodeBlock language="tsx">
        {`import { Editor } from "@/components/editor/editor";

function MyPage() {
  return (
    <Editor
      editable={true}
      onChange={(snapshot) => {
        console.log(snapshot.html);
        console.log(snapshot.markdown);
      }}
    />
  );
}`}
      </CodeBlock>

      <SubHeading id="props">Editor Props</SubHeading>
      <Paragraph>
        The <code>Editor</code> component accepts the following props:
      </Paragraph>
      <CodeBlock language="typescript">
        {`interface EditorProps {
  className?: string;
  editable?: boolean;         // default: true
  initialHtml?: string;       // seed content from HTML
  initialMarkdown?: string;   // seed content from Markdown
  onChange?: (snapshot: EditorSnapshot, editor: LexicalEditor) => void;
  placeholder?: string;
}`}
      </CodeBlock>

      <Callout title="That's it" variant="tip">
        The editor is self-contained. It manages its own Lexical composer,
        plugins, and toolbar. No providers or context wrappers are needed beyond
        what React and your CSS already provide.
      </Callout>
    </>
  );
}
