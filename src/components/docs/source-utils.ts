const escapeRegex = (value: string) => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const matchSource = (
  source: string,
  expression: RegExp,
  errorMessage: string
) => {
  const match = source.match(expression)?.[0];

  if (!match) {
    throw new Error(errorMessage);
  }

  return match.trim();
};

export function extractMarkedSource(source: string, marker: string) {
  return matchSource(
    source,
    new RegExp(
      `/\\* docs:start ${escapeRegex(marker)} \\*/([\\s\\S]*?)/\\* docs:end ${escapeRegex(marker)} \\*/`
    ),
    `Marked source was not found for: ${marker}`
  )
    .replace(new RegExp(`^/\\* docs:start ${escapeRegex(marker)} \\*/\\n?`), "")
    .replace(new RegExp(`\\n?/\\* docs:end ${escapeRegex(marker)} \\*/$`), "")
    .trim();
}

export function extractExportedInterface(source: string, name: string) {
  return matchSource(
    source,
    new RegExp(
      `export interface ${escapeRegex(name)}\\s*\\{[\\s\\S]*?^\\}`,
      "m"
    ),
    `Interface source was not found for: ${name}`
  );
}

export function extractExportedConst(source: string, name: string) {
  return matchSource(
    source,
    new RegExp(`export const ${escapeRegex(name)}\\s*=\\s*[\\s\\S]*?;`, "m"),
    `Const source was not found for: ${name}`
  );
}
