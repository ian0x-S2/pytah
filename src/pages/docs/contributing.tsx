import {
  ContributorChecklistTable,
  REGISTRY_WORKFLOW_COMMAND,
  STANDARD_VALIDATION_COMMAND,
  WhereToChangeTable,
} from "@/components/docs/contributor-reference";
import {
  Callout,
  CodeBlock,
  PageHeader,
  Paragraph,
  SectionHeading,
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
      <WhereToChangeTable
        headers={["If you need to change...", "Start here", "Notes"]}
      />

      <SectionHeading id="change-checklist">
        Default Change Checklist
      </SectionHeading>
      <Paragraph>
        Before you ship a change, preserve the editor invariants that make this
        repo valuable as a reference implementation.
      </Paragraph>
      <ContributorChecklistTable />

      <Paragraph>
        Run the standard validation flow before handing work off:
      </Paragraph>
      <CodeBlock language="bash">{STANDARD_VALIDATION_COMMAND}</CodeBlock>

      <SectionHeading id="registry-workflow">
        Registry and Dependency Workflow
      </SectionHeading>
      <Paragraph>
        Most edits only need the standard validation flow. Reach for the
        registry and dependency scripts when you are changing shipped registry
        output or compatibility expectations.
      </Paragraph>
      <CodeBlock language="bash">{REGISTRY_WORKFLOW_COMMAND}</CodeBlock>

      <Callout title="Standards" variant="info">
        Use <code>AGENTS.md</code> for the deeper architecture rules and coding
        conventions. Use the docs pages for the human-readable product and
        onboarding narrative.
      </Callout>
    </>
  );
}
