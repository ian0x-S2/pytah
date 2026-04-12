import {
  Callout,
  CodeBlock,
  extractExportedInterface,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
} from "@/components/docs/primitives";
import editorTypesSource from "@/components/editor/core/types.ts?raw";

const actionBarControlsSource = extractExportedInterface(
  editorTypesSource,
  "EditorActionBarControls"
);

const footerContextSource = extractExportedInterface(
  editorTypesSource,
  "EditorFooterContext"
);

const outputContextSource = extractExportedInterface(
  editorTypesSource,
  "EditorOutputContext"
);

const shellContextSource = extractExportedInterface(
  editorTypesSource,
  "EditorShellContext"
);

const editorPropsSource = extractExportedInterface(
  editorTypesSource,
  "EditorProps"
);

export function ApiPage() {
  return (
    <>
      <PageHeader
        badge="API"
        description="Public types and extension contracts for embedding and composing the editor."
        title="API"
      />

      <SectionHeading id="editor-props">Editor Props</SectionHeading>
      <Paragraph>
        <code>EditorProps</code> is the main public contract for consumers. It
        combines ready-made editor options with composition-focused extension
        points.
      </Paragraph>
      <CodeBlock language="typescript">{editorPropsSource}</CodeBlock>

      <SectionHeading id="slot-contexts">Slot Contexts</SectionHeading>
      <Paragraph>
        Some slots receive contextual helpers so replacements can still use the
        built-in editor actions and state.
      </Paragraph>

      <SubHeading id="action-bar-controls">Action Bar Controls</SubHeading>
      <CodeBlock language="typescript">{actionBarControlsSource}</CodeBlock>

      <SubHeading id="footer-context">Footer Context</SubHeading>
      <CodeBlock language="typescript">{footerContextSource}</CodeBlock>

      <SubHeading id="output-context">Output Context</SubHeading>
      <CodeBlock language="typescript">{outputContextSource}</CodeBlock>

      <SubHeading id="shell-context">Shell Context</SubHeading>
      <CodeBlock language="typescript">{shellContextSource}</CodeBlock>

      <SectionHeading id="examples">Examples</SectionHeading>

      <SubHeading id="minimal-product-editor">
        Minimal Product Editor
      </SubHeading>
      <CodeBlock language="tsx">
        {`<Editor editable minimal toolbar="basic" />`}
      </CodeBlock>

      <SubHeading id="replace-outputs">Replace Outputs</SubHeading>
      <CodeBlock language="tsx">
        {`<Editor
  chrome={{ outputs: true }}
  slots={{
    outputs: ({ snapshot }) => (
      <section>
        <h2>Markdown</h2>
        <pre>{snapshot.markdown}</pre>
      </section>
    ),
  }}
/>`}
      </CodeBlock>

      <SubHeading id="register-extra-node">Register Extra Node</SubHeading>
      <CodeBlock language="tsx">
        {"<Editor extraNodes={[CalloutNode]} />"}
      </CodeBlock>

      <SubHeading id="multiple-editors">Multiple Editors</SubHeading>
      <CodeBlock language="tsx">
        {`<>
  <Editor namespace="marketing-docs" />
  <Editor namespace="knowledge-base" />
</>`}
      </CodeBlock>

      <Callout title="Public API boundary" variant="info">
        If a customization requires editing <code>ui/content.tsx</code> or
        <code>core/config.ts</code>, treat that as a signal that the public API
        may still be missing an extension point.
      </Callout>
    </>
  );
}
