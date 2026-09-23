const escapeRegex = (value: string) =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");

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
      `/\\* docs:start ${escapeRegex(marker)} \\*/([\\s\\S]*?)/\\* docs:end ${escapeRegex(marker)} \\*/`,
      "u"
    ),
    `Marked source was not found for: ${marker}`
  )
    .replace(new RegExp(`^/\\* docs:start ${escapeRegex(marker)} \\*/\\n?`, "u"), "")
    .replace(new RegExp(`\\n?/\\* docs:end ${escapeRegex(marker)} \\*/$`, "u"), "")
    .trim();
}

export function extractExportedInterface(source: string, name: string) {
  return matchSource(
    source,
    new RegExp(
      `export interface ${escapeRegex(name)}\\s*\\{[\\s\\S]*?^\\}`,
      "mu"
    ),
    `Interface source was not found for: ${name}`
  );
}

export function extractExportedConst(source: string, name: string) {
  return matchSource(
    source,
    new RegExp(`export const ${escapeRegex(name)}\\s*=\\s*[\\s\\S]*?;`, "mu"),
    `Const source was not found for: ${name}`
  );
}
