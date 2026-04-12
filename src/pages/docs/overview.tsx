import { RepositoryMentalModelTable } from "@/components/docs/contributor-reference";
import {
  Callout,
  PageHeader,
  Paragraph,
  SectionHeading,
  Table,
  TableCell,
  TableRow,
} from "@/components/docs/primitives";

export function OverviewPage() {
  return (
    <>
      <PageHeader
        badge="Start Here"
        description="What Pytah is, who this repository serves, and which path to follow next."
        title="Overview"
      />

      <SectionHeading id="what-is-pytah">What is Pytah?</SectionHeading>
      <Paragraph>
        Pytah is a rich text editor reference implementation and shadcn registry
        item built with React, Lexical, shadcn/Base UI, and Tailwind CSS v4.
      </Paragraph>
      <Paragraph>
        This repository is the demo app, docs site, and canonical source for the
        editor code that the registry serves. It exists both for teams that want
        to embed the editor and for contributors who want to evolve the editor
        core.
      </Paragraph>

      <Callout title="Why the repository can feel different" variant="info">
        Pytah is not just an app and not just a component package. It is a
        working product surface, a source-driven docs site, and the source of
        truth for the shipped editor implementation.
      </Callout>

      <SectionHeading id="choose-your-path">Choose Your Path</SectionHeading>
      <Table headers={["If you want to...", "Start here", "Then read"]}>
        <TableRow>
          <TableCell>evaluate the editor UX</TableCell>
          <TableCell>
            <code>/demo</code>
          </TableCell>
          <TableCell>
            <code>/docs/overview</code> and feature guides under{" "}
            <code>/docs/guides/*</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>install the editor into another app</TableCell>
          <TableCell>
            <code>/docs/getting-started</code>
          </TableCell>
          <TableCell>
            <code>/docs/composition</code> and <code>/docs/api</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>contribute to the editor core in this repo</TableCell>
          <TableCell>
            <code>/docs/contributing</code>
          </TableCell>
          <TableCell>
            <code>/docs/architecture</code>, <code>/docs/plugins</code>, and{" "}
            <code>CONTRIBUTING.md</code>
          </TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="usage-model">
        Three Ways to Use the Editor
      </SectionHeading>
      <Table headers={["Mode", "Reach for it when...", "Main levers"]}>
        <TableRow>
          <TableCell>
            <strong>Ready-made</strong>
          </TableCell>
          <TableCell>
            You want a working editor with the default Pytah experience.
          </TableCell>
          <TableCell>
            <code>minimal</code>, <code>toolbar</code>, <code>editable</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Composable</strong>
          </TableCell>
          <TableCell>
            You want to keep the editor foundation but tune behavior or replace
            surfaces.
          </TableCell>
          <TableCell>
            <code>features</code>, <code>chrome</code>, <code>slots</code>,{" "}
            <code>pluginSlots</code>, <code>extraNodes</code>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <strong>Raw Lexical</strong>
          </TableCell>
          <TableCell>
            You need full ownership of the Lexical stack and only want Pytah as
            reference material.
          </TableCell>
          <TableCell>
            <code>LexicalComposer</code> plus the patterns documented in{" "}
            <code>/docs/composition</code>
          </TableCell>
        </TableRow>
      </Table>

      <SectionHeading id="repo-map">Repository Mental Model</SectionHeading>
      <Paragraph>
        <code>src/components/editor/editor.tsx</code> is the public composition
        root. Everything else exists to support or extend that surface.
      </Paragraph>
      <RepositoryMentalModelTable />
    </>
  );
}
