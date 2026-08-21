import { docsFeatureRows, docsTransformerRows } from "@/data/docs-metadata";
import { Table, TableCell, TableRow } from "./primitives";

export function FeatureTable() {
  return (
    <Table headers={["Flag", "Editable-only", "Ships", "Slash commands"]}>
      {docsFeatureRows.map((feature) => (
        <TableRow key={feature.flag}>
          <TableCell>
            <code>{feature.flag}</code>
          </TableCell>
          <TableCell>{feature.editableOnly ? "Yes" : "No"}</TableCell>
          <TableCell>
            {[
              feature.hasNodes ? "nodes" : null,
              feature.hasPlugin ? "plugin" : null,
              feature.transformerCount > 0 ? "transformers" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "flag only"}
          </TableCell>
          <TableCell>
            {feature.slashCommandIds.length > 0
              ? feature.slashCommandIds.join(", ")
              : "—"}
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}

export function TransformersTable() {
  return (
    <Table headers={["Name", "Markdown", "Kind"]}>
      {docsTransformerRows.map((transformer) => (
        <TableRow key={`${transformer.kind}:${transformer.markdown}`}>
          <TableCell>{transformer.name}</TableCell>
          <TableCell>
            <code>{transformer.markdown}</code>
          </TableCell>
          <TableCell>
            <code>{transformer.kind}</code>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
