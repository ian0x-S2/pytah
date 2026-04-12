import {
  Callout,
  CodeBlock,
  extractExportedInterface,
  extractMarkedSource,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";
import compatibility from "@/components/editor/core/compatibility.json";
import editorTypesSource from "@/components/editor/core/types.ts?raw";
import indexCssSource from "@/index.css?raw";
import { DEMO_EDITOR_USAGE_EXAMPLE } from "@/pages/demo";

const editorPropsSource = extractExportedInterface(
  editorTypesSource,
  "EditorProps"
);

const highlightTokensSource = extractMarkedSource(
  indexCssSource,
  "highlight-tokens-light"
);

const darkHighlightTokensSource = extractMarkedSource(
  indexCssSource,
  "highlight-tokens-dark"
);

const tailwindThemeBridgeSource = extractMarkedSource(
  indexCssSource,
  "highlight-theme-bridge"
);

export function GettingStartedPage() {
  return (
    <>
      <PageHeader
        badge="Core Doc"
        description="Add the Pytah editor to another React + shadcn/ui project via the registry or manual copy-paste."
        title="Getting Started"
      />

      <Callout title="For consumers of the editor" variant="info">
        This page is for embedding Pytah into another app. If you are editing
        the Pytah repository itself, start with <code>/docs/contributing</code>.
      </Callout>

      <SectionHeading id="prerequisites">Prerequisites</SectionHeading>
      <Paragraph>
        Your project needs <code>React {compatibility.requirements.react}</code>
        , <code>Tailwind CSS {compatibility.requirements.tailwind}</code>, and{" "}
        <code>shadcn/ui {compatibility.requirements.shadcn}</code> already
        configured. The editor is built on <code>@base-ui/react</code>
        primitives, not Radix UI, and is currently validated against Lexical{" "}
        <code>{compatibility.requirements.lexical}</code>.
      </Paragraph>

      <SectionHeading id="install-cli">
        1. Install with shadcn CLI
      </SectionHeading>
      <Paragraph>
        The fastest path is the registry item served by this app. Use the
        published registry URL in your own project, or the local URL while this
        docs app is running on your machine:
      </Paragraph>
      <CodeBlock language="bash">
        {`# local docs/dev server
bun x shadcn@latest add http://localhost:5173/r/editor.json

# same path on your deployed host
bun x shadcn@latest add https://your-domain.example/r/editor.json`}
      </CodeBlock>
      <Paragraph>
        The path is always <code>/r/editor.json</code>. Only the origin changes
        between local and deployed environments.
      </Paragraph>
      <Callout title="What gets installed" variant="tip">
        The registry item installs the full editor tree, the required
        <code>ui</code> wrappers, <code>lib/utils.ts</code>, the Lexical/Base UI
        dependencies, and the editor highlight tokens.
      </Callout>
      <Paragraph>
        Your app still needs the normal <code>shadcn/ui</code> foundations in
        place: React {compatibility.requirements.react}, Tailwind CSS{" "}
        {compatibility.requirements.tailwind}, a valid{" "}
        <code>components.json</code>, and the standard <code>@/</code> alias
        pointing at <code>src</code>.
      </Paragraph>
      <Callout title="Compatibility" variant="tip">
        <code>React {compatibility.requirements.react}</code>,{" "}
        <code>Tailwind CSS {compatibility.requirements.tailwind}</code>,{" "}
        <code>shadcn/ui {compatibility.requirements.shadcn}</code>, and{" "}
        <code>Lexical {compatibility.requirements.lexical}</code> are the
        versions this registry item is currently validated against.
      </Callout>

      <SectionHeading id="copy-files">
        2. Manual Copy-Paste Fallback
      </SectionHeading>
      <Paragraph>
        If you do not want to consume the registry item, install the editor
        manually. First install the Lexical editor framework and its companion
        packages:
      </Paragraph>
      <CodeBlock language="bash">
        {`bun add lexical @lexical/react @lexical/rich-text @lexical/list \\
  @lexical/code @lexical/link @lexical/table @lexical/html \\
  @lexical/markdown @lexical/utils @lexical/selection \\
  @lexical/clipboard @lexical/history @lexical/extension`}
      </CodeBlock>
      <Paragraph>Then install the UI dependencies you still need:</Paragraph>
      <CodeBlock language="bash">
        {`bun add @base-ui/react class-variance-authority clsx \\
  tailwind-merge cmdk lucide-react`}
      </CodeBlock>
      <Paragraph>
        Then copy these directories and files into your project, preserving
        their relative paths:
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
        <code>./src</code>). A normal <code>shadcn init</code> setup already
        gives you this. If your project differs, update{" "}
        <code>tsconfig.json</code>
        and your bundler config, or rewrite the imports.
      </Callout>
      <Paragraph>
        {compatibility.notes.animate} {compatibility.notes.css}
      </Paragraph>
      <SectionHeading id="add-tokens">3. Add CSS Tokens</SectionHeading>
      <Paragraph>
        The CLI path adds these automatically. For manual installs, the editor
        uses two custom design tokens not in the default ShadCN palette. Add
        these to your CSS <code>:root</code> and <code>.dark</code> blocks:
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
        After installation, import <code>Editor</code> from
        <code>@/components/editor/editor</code>. The demo page is the smallest
        real integration in this repository. It toggles edit mode and mounts the
        editor in minimal mode:
      </Paragraph>
      <CodeBlock language="tsx">{DEMO_EDITOR_USAGE_EXAMPLE}</CodeBlock>

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
      features={{
        floatingToolbar: false,
        images: false,
        slashCommand: true,
        youtube: false,
      }}
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
