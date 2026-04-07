import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function ContributingPage() {
  return (
    <>
      <PageHeader
        badge="Contributor Doc"
        description="Use this page when you are changing the Pytah repository itself rather than embedding the editor into another app."
        title="Contributing"
      />

      <Callout title="Consumer docs vs contributor docs" variant="tip">
        If you only want to install the editor into your own app, go to{" "}
        <code>/docs/getting-started</code>. This page is for editing the core
        editor, docs, or registry inside this repository.
      </Callout>

      <SectionHeading id="local-loop">Local Development Loop</SectionHeading>
      <Paragraph>
        Start by installing dependencies and running the local app. The fastest
        feedback loop is to keep the demo and docs open while you work.
      </Paragraph>
      <CodeBlock language="bash">{`bun install
bun run dev`}</CodeBlock>
      <Paragraph>
        Use <code>/demo</code> to exercise behavior directly,{" "}
        <code>/docs/overview</code> to re-ground yourself in the repository
        purpose, and <code>/docs/architecture</code> when tracing which layer
        owns a feature.
      </Paragraph>

      <SectionHeading id="where-to-change">
        Where to Change Things
      </SectionHeading>
      <Table headers={["If you need to change...", "Start here", "Notes"]}>
        <TableRow>
          <TableCell>the public editor API or top-level wiring</TableCell>
          <TableCell>
            <code>src/components/editor/editor.tsx</code> and{" "}
            <code>src/components/editor/core/types.ts</code>
          </TableCell>
          <TableCell>
            Keep the default editor opinionated, but prefer public extension
            points over internal-only forks.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>built-in Lexical behavior</TableCell>
          <TableCell>
            <code>src/components/editor/plugins/&lt;feature&gt;/</code>
          </TableCell>
          <TableCell>
            Plugins own commands, listeners, transforms, and any feature-local
            UI they need.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>editor chrome or React surfaces</TableCell>
          <TableCell>
            <code>src/components/editor/ui/</code>
          </TableCell>
          <TableCell>
            This layer owns shells, panels, toolbars, and content composition.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>custom Lexical nodes</TableCell>
          <TableCell>
            <code>src/components/editor/core/nodes/&lt;feature&gt;/</code>
          </TableCell>
          <TableCell>
            Keep node files feature-local and align them with their owning
            plugin directory when a feature has both.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>onboarding or public docs</TableCell>
          <TableCell>
            <code>src/pages/docs/</code>, <code>README.md</code>, and{" "}
            <code>CONTRIBUTING.md</code>
          </TableCell>
          <TableCell>
            Keep repo-level context consistent across the app docs and the
            GitHub landing page.
          </TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="change-checklist">
        Default Change Checklist
      </SectionHeading>
      <Paragraph>
        Before you ship a change, preserve the editor invariants that make this
        repo valuable as a reference implementation.
      </Paragraph>
      <Table headers={["Check", "Why it matters"]}>
        <TableRow>
          <TableCell>Editable and read-only modes still work</TableCell>
          <TableCell>
            The editor is expected to support both modes without forking the
            implementation.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>HTML and Markdown copy/paste still behave well</TableCell>
          <TableCell>
            Copy/paste quality is part of the project purpose, not a
            nice-to-have.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            New behavior uses extension points where possible
          </TableCell>
          <TableCell>
            Pytah aims for a lego-like editor, not a monolithic editor tree.
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Docs stay aligned with the real implementation</TableCell>
          <TableCell>
            The docs are part of the developer experience and should not drift
            away from source.
          </TableCell>
        </TableRow>
      </Table>

      <Paragraph>
        Run the standard validation flow before handing work off:
      </Paragraph>
      <CodeBlock language="bash">{`bun run check
bun run build`}</CodeBlock>

      <SectionHeading id="registry-workflow">
        Registry and Dependency Workflow
      </SectionHeading>
      <Paragraph>
        Most edits only need the standard validation flow. Reach for the
        registry and dependency scripts when you are changing shipped registry
        output or compatibility expectations.
      </Paragraph>
      <CodeBlock language="bash">{`bun run registry:build
bun run registry:smoke
bun run deps:check
bun run deps:validate`}</CodeBlock>

      <Callout title="Standards" variant="info">
        Use <code>AGENTS.md</code> for the deeper architecture rules and coding
        conventions. Use the docs pages for the human-readable product and
        onboarding narrative.
      </Callout>
    </>
  );
}
