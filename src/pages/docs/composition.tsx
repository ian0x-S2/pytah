import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  SubHeading,
  sliceSource,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";
import compositionSource from "@/components/editor/core/composition.ts?raw";
import editorTypesSource from "@/components/editor/core/types.ts?raw";

const featureFlagsSource = sliceSource(editorTypesSource, {
  end: "}",
  start: "export interface EditorFeatureFlags {",
});

const chromeOptionsSource = sliceSource(editorTypesSource, {
  end: "}",
  start: "export interface EditorChromeOptions {",
});

const pluginSlotsSource = sliceSource(editorTypesSource, {
  end: "}",
  start: "export interface EditorPluginSlots {",
});

const chromeSlotsSource = sliceSource(editorTypesSource, {
  end: "}",
  start: "export interface EditorChromeSlots {",
});

const defaultFeaturesSource = sliceSource(compositionSource, {
  end: "} as const satisfies Required<EditorFeatureFlags>;",
  start: "export const DEFAULT_EDITOR_FEATURES = {",
});

const defaultChromeSource = sliceSource(compositionSource, {
  end: "} as const satisfies Required<EditorChromeOptions>;",
  start: "export const DEFAULT_EDITOR_CHROME = {",
});

export function CompositionPage() {
  return (
    <>
      <PageHeader
        badge="Core Doc"
        description="How to treat the editor as a set of reusable building blocks instead of a fixed product shell."
        title="Composition"
      />

      <SectionHeading id="model">Composition Model</SectionHeading>
      <Paragraph>
        The default <code>Editor</code> stays opinionated, but the intended DX
        is no longer "copy the editor and edit it from inside". The intended
        path is to compose from public extension points.
      </Paragraph>
      <Table headers={["Layer", "Purpose", "Typical knobs"]}>
        <TableRow>
          <TableCell>
            <strong>Ready-made editor</strong>
          </TableCell>
          <TableCell>
            Use the default Pytah experience with minimal setup
          </TableCell>
          <TableCell>
            <code>minimal</code>, <code>toolbar</code>, <code>editable</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Feature composition</strong>
          </TableCell>
          <TableCell>Toggle built-in behavior plugins on or off</TableCell>
          <TableCell>
            <code>features</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Chrome composition</strong>
          </TableCell>
          <TableCell>Show, hide, or replace visual editor surfaces</TableCell>
          <TableCell>
            <code>chrome</code>, <code>slots</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Behavior extension</strong>
          </TableCell>
          <TableCell>
            Mount additional plugins around the built-in stack
          </TableCell>
          <TableCell>
            <code>pluginSlots</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Lexical extension</strong>
          </TableCell>
          <TableCell>Add custom nodes without touching core config</TableCell>
          <TableCell>
            <code>extraNodes</code>, <code>namespace</code>
          </TableCell>
        </TableRow>
      </Table>

      <Callout title="Default-first, not hardcoded" variant="tip">
        The default editor should remain the easiest path, but it should not be
        the only path. When adding new capabilities, prefer new extension points
        over new internal-only branches.
      </Callout>

      <SectionHeading id="features">Feature Flags</SectionHeading>
      <Paragraph>
        Use <code>features</code> to control built-in behavior plugins without
        forking <code>ui/content.tsx</code>.
      </Paragraph>
      <Paragraph>
        Feature flags also trim dependent slash-menu entries, so disabling a
        built-in block capability keeps the visible command list in sync with
        the mounted plugin stack.
      </Paragraph>
      <CodeBlock language="typescript">{featureFlagsSource}</CodeBlock>

      <SubHeading id="defaults-features">Default Feature Stack</SubHeading>
      <Paragraph>
        These are the built-in behavior defaults resolved by the editor.
      </Paragraph>
      <CodeBlock language="typescript">{defaultFeaturesSource}</CodeBlock>

      <CodeBlock language="tsx">
        {`<Editor
  features={{
    images: false,
    layouts: false,
    floatingToolbar: false,
    focusOnMount: false,
    slashCommand: true,
  }}
/>`}
      </CodeBlock>

      <SectionHeading id="chrome">Chrome</SectionHeading>
      <Paragraph>
        Use <code>chrome</code> when you want to keep the default editor content
        and plugin stack, but remove opinionated product surfaces like the
        shell, header, footer, or output panes.
      </Paragraph>
      <CodeBlock language="typescript">{chromeOptionsSource}</CodeBlock>

      <SubHeading id="defaults-chrome">Default Chrome</SubHeading>
      <CodeBlock language="typescript">{defaultChromeSource}</CodeBlock>

      <CodeBlock language="tsx">
        {`<Editor
  chrome={{
    actionBar: false,
    footer: false,
    outputs: false,
  }}
  toolbar="full"
/>`}
      </CodeBlock>

      <SectionHeading id="slots">Slots</SectionHeading>
      <Paragraph>
        Use <code>slots</code> to replace visual surfaces instead of reaching
        into editor internals. Slot values can be static React nodes or render
        functions when the slot needs context.
      </Paragraph>
      <CodeBlock language="typescript">{chromeSlotsSource}</CodeBlock>

      <CodeBlock language="tsx">
        {`<Editor
  slots={{
    actionBar: ({ onReset, onLoadMarkdown }) => (
      <div className="flex gap-2 px-4 py-3">
        <button onClick={onLoadMarkdown} type="button">Seed markdown</button>
        <button onClick={onReset} type="button">Reset</button>
      </div>
    ),
    header: <MyEditorHeader />,
    outputs: ({ snapshot }) => <MyPreview markdown={snapshot.markdown} />,
  }}
/>`}
      </CodeBlock>

      <SectionHeading id="plugin-slots">Plugin Slots</SectionHeading>
      <Paragraph>
        Use <code>pluginSlots</code> when you want to add behavior without
        editing the built-in orchestration file.
      </Paragraph>
      <CodeBlock language="typescript">{pluginSlotsSource}</CodeBlock>

      <CodeBlock language="tsx">
        {`<Editor
  pluginSlots={{
    beforeDefault: <MetricsPlugin />,
    afterEditable: <MySlashTelemetryPlugin />,
  }}
/>`}
      </CodeBlock>

      <Paragraph>
        Use <code>beforeDefault</code> and <code>afterDefault</code> for plugins
        that should run in both editable and read-only modes. Use
        <code>beforeEditable</code> and <code>afterEditable</code> for edit-only
        plugin mounts.
      </Paragraph>

      <SectionHeading id="guidelines">Guidelines</SectionHeading>
      <Paragraph>
        Reach for the smallest public lever that solves the need:
      </Paragraph>
      <Table headers={["Need", "Preferred tool"]}>
        <TableRow>
          <TableCell>Disable built-in behavior</TableCell>
          <TableCell>
            <code>features</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Hide a default UI surface</TableCell>
          <TableCell>
            <code>chrome</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Replace a visual surface</TableCell>
          <TableCell>
            <code>slots</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Add custom behavior</TableCell>
          <TableCell>
            <code>pluginSlots</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Add custom Lexical node support</TableCell>
          <TableCell>
            <code>extraNodes</code>
          </TableCell>
        </TableRow>
      </Table>
    </>
  );
}
