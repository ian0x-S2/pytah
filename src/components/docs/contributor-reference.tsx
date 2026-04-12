import type { ReactNode } from "react";
import { Table, TableCell, TableRow } from "./primitives";

interface ThreeColumnRow {
  first: ReactNode;
  key: string;
  second: ReactNode;
  third: ReactNode;
}

const REPOSITORY_MENTAL_MODEL_ROWS: ThreeColumnRow[] = [
  {
    first: <code>src/components/editor/editor.tsx</code>,
    key: "editor-root",
    second: "top-level editor composition and public defaults",
    third: "you need to understand how the product editor is wired together",
  },
  {
    first: <code>src/components/editor/core/</code>,
    key: "core-layer",
    second: "config, types, nodes, utilities, and composition helpers",
    third:
      "you are changing editor contracts, node registration, or shared internals",
  },
  {
    first: <code>src/components/editor/plugins/</code>,
    key: "plugins-layer",
    second: "Lexical behavior plugins and feature-specific wiring",
    third: "you are changing commands, listeners, or feature behavior",
  },
  {
    first: <code>src/components/editor/ui/</code>,
    key: "ui-layer",
    second: "toolbars, panels, shells, and other React surfaces",
    third: "you are changing the editor chrome or composition UI",
  },
  {
    first: <code>src/pages/docs/</code>,
    key: "docs-layer",
    second: "consumer-facing documentation sourced from the codebase",
    third: "you are updating onboarding, examples, or the public mental model",
  },
];

const WHERE_TO_CHANGE_ROWS: ThreeColumnRow[] = [
  {
    first: "Change a public prop or extension point",
    key: "public-prop",
    second: (
      <>
        <code>editor.tsx</code> and <code>core/types.ts</code>
      </>
    ),
    third:
      "Public contracts live where the ready-made editor and composition API meet.",
  },
  {
    first: "Add or adjust built-in behavior",
    key: "built-in-behavior",
    second: <code>plugins/&lt;feature&gt;/</code>,
    third:
      "Feature behavior belongs with its Lexical commands, transforms, and feature-local UI.",
  },
  {
    first: "Change toolbars, panels, or shell UI",
    key: "chrome-ui",
    second: <code>ui/</code>,
    third:
      "The React composition layer owns the visual surfaces around the editor.",
  },
  {
    first: "Add a new node or serialization helper",
    key: "node-or-serializer",
    second: <code>core/nodes/&lt;feature&gt;/</code>,
    third:
      "Node code stays feature-local and should align with its owning plugin when a feature spans both layers.",
  },
  {
    first: "Update onboarding or examples",
    key: "docs-and-onboarding",
    second: (
      <>
        <code>src/pages/docs/</code>, <code>README.md</code>, and{" "}
        <code>CONTRIBUTING.md</code>
      </>
    ),
    third:
      "Repo context should stay consistent across the app docs and GitHub landing page.",
  },
];

const CONTRIBUTOR_CHECKLIST_ROWS: ThreeColumnRow[] = [
  {
    first: "Editable and read-only modes still work",
    key: "editable-readonly",
    second:
      "The editor is expected to support both modes without forking the implementation.",
    third: null,
  },
  {
    first: "HTML and Markdown copy/paste still behave well",
    key: "copy-paste",
    second:
      "Copy/paste quality is part of the project purpose, not a nice-to-have.",
    third: null,
  },
  {
    first: "New behavior uses extension points where possible",
    key: "extension-points",
    second: "Pytah aims for a lego-like editor, not a monolithic editor tree.",
    third: null,
  },
  {
    first: "Docs stay aligned with the real implementation",
    key: "docs-alignment",
    second:
      "The docs are part of the developer experience and should not drift away from source.",
    third: null,
  },
];

function renderThreeColumnRows(rows: ThreeColumnRow[]) {
  return rows.map((row) => (
    <TableRow key={row.key}>
      <TableCell>{row.first}</TableCell>
      <TableCell>{row.second}</TableCell>
      {row.third ? <TableCell>{row.third}</TableCell> : null}
    </TableRow>
  ));
}

export function RepositoryMentalModelTable() {
  return (
    <Table headers={["Area", "Owns", "Start there when..."]}>
      {renderThreeColumnRows(REPOSITORY_MENTAL_MODEL_ROWS)}
    </Table>
  );
}

export function WhereToChangeTable({
  headers = ["Need", "Start in", "Why"],
}: {
  headers?: [string, string, string];
}) {
  return (
    <Table headers={headers}>
      {renderThreeColumnRows(WHERE_TO_CHANGE_ROWS)}
    </Table>
  );
}

export function ContributorChecklistTable() {
  return (
    <Table headers={["Check", "Why it matters"]}>
      {CONTRIBUTOR_CHECKLIST_ROWS.map((row) => (
        <TableRow key={row.key}>
          <TableCell>{row.first}</TableCell>
          <TableCell>{row.second}</TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

export const STANDARD_VALIDATION_COMMAND = `bun run check
bun run build`;

export const REGISTRY_WORKFLOW_COMMAND = `bun run registry:build
bun run registry:smoke
bun run deps:check
bun run deps:validate`;
