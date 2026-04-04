import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "public", "r");
const editorSourceDirectory = path.join(
  projectRoot,
  "src",
  "components",
  "editor"
);
const compatibilityMetadataPath = path.join(
  projectRoot,
  "src",
  "components",
  "editor",
  "core",
  "compatibility.json"
);

const editorUiFiles = [
  "button.tsx",
  "command.tsx",
  "dialog.tsx",
  "input.tsx",
  "input-group.tsx",
  "popover.tsx",
  "separator.tsx",
  "textarea.tsx",
  "toggle.tsx",
];

const registryDependencyNames = [
  "@base-ui/react",
  "@lexical/clipboard",
  "@lexical/code",
  "@lexical/extension",
  "@lexical/history",
  "@lexical/html",
  "@lexical/link",
  "@lexical/list",
  "@lexical/markdown",
  "@lexical/react",
  "@lexical/rich-text",
  "@lexical/selection",
  "@lexical/table",
  "@lexical/utils",
  "class-variance-authority",
  "clsx",
  "cmdk",
  "lexical",
  "lucide-react",
  "tailwind-merge",
];

const registryPathPrefix = "registry/pytah/editor";

const toPosixPath = (value) => value.split(path.sep).join(path.posix.sep);

const readJson = async (filePath) => {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
};

const getPackageDependencies = async () => {
  const packageJson = await readJson(path.join(projectRoot, "package.json"));

  return registryDependencyNames.map((name) => {
    const version = packageJson.dependencies[name];

    if (!version) {
      throw new Error(`Missing dependency version for ${name}`);
    }

    return `${name}@${version}`;
  });
};

const getCompatibilityMetadata = () => {
  return readJson(compatibilityMetadataPath);
};

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }

    if (!(entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      continue;
    }

    files.push(absolutePath);
  }

  return files.sort((left, right) => left.localeCompare(right));
};

const createRegistryFileEntry = async ({
  absolutePath,
  registryPath,
  target,
}) => {
  const content = await readFile(absolutePath, "utf8");

  return {
    content,
    path: registryPath,
    target,
    type: "registry:file",
  };
};

const getEditorEntries = async () => {
  const editorFiles = await collectSourceFiles(editorSourceDirectory);

  return Promise.all(
    editorFiles.map((absolutePath) => {
      const relativePath = path.relative(
        path.join(projectRoot, "src", "components"),
        absolutePath
      );
      const normalizedPath = toPosixPath(relativePath);

      return createRegistryFileEntry({
        absolutePath,
        registryPath: path.posix.join(
          registryPathPrefix,
          "components",
          normalizedPath
        ),
        target: path.posix.join("src", "components", normalizedPath),
      });
    })
  );
};

const getEditorUiEntries = () => {
  return Promise.all(
    editorUiFiles.map((fileName) => {
      const absolutePath = path.join(
        projectRoot,
        "src",
        "components",
        "ui",
        fileName
      );

      return createRegistryFileEntry({
        absolutePath,
        registryPath: path.posix.join(registryPathPrefix, "ui", fileName),
        target: path.posix.join("src", "components", "ui", fileName),
      });
    })
  );
};

const getLibEntries = () => {
  return Promise.all([
    createRegistryFileEntry({
      absolutePath: path.join(projectRoot, "src", "lib", "utils.ts"),
      registryPath: path.posix.join(registryPathPrefix, "lib", "utils.ts"),
      target: path.posix.join("src", "lib", "utils.ts"),
    }),
    createRegistryFileEntry({
      absolutePath: compatibilityMetadataPath,
      registryPath: path.posix.join(
        registryPathPrefix,
        "components",
        "editor",
        "core",
        "compatibility.json"
      ),
      target: path.posix.join(
        "src",
        "components",
        "editor",
        "core",
        "compatibility.json"
      ),
    }),
  ]);
};

const createEditorItem = async () => {
  const [
    compatibility,
    dependencies,
    editorEntries,
    editorUiEntries,
    libEntries,
  ] = await Promise.all([
    getCompatibilityMetadata(),
    getPackageDependencies(),
    getEditorEntries(),
    getEditorUiEntries(),
    getLibEntries(),
  ]);

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    author: "Pytah",
    categories: ["editor"],
    cssVars: {
      theme: {
        "color-highlight": "var(--highlight)",
        "color-highlight-foreground": "var(--highlight-foreground)",
      },
      light: {
        highlight: "oklch(0.97 0.05 90)",
        "highlight-foreground": "oklch(0.145 0 0)",
      },
      dark: {
        highlight: "oklch(0.35 0.06 85)",
        "highlight-foreground": "oklch(0.985 0 0)",
      },
    },
    dependencies,
    description:
      "Copy/paste-ready Lexical editor with slash commands, floating controls, tables, images, embeds, and markdown/html interoperability.",
    docs: [
      `Install into a React ${compatibility.requirements.react} + Tailwind CSS ${compatibility.requirements.tailwind} + shadcn/ui ${compatibility.requirements.shadcn} project.`,
      "",
      "The item writes to your configured `components`, `ui`, and `lib` aliases.",
      "It expects the standard `@/` alias contract from `components.json`.",
      compatibility.notes.animate,
      `The editor is currently validated against Lexical ${compatibility.requirements.lexical}.`,
      "",
      "Render it with:",
      "```tsx",
      'import { Editor } from "@/components/editor/editor"',
      "",
      "export function Page() {",
      '  return <Editor minimal toolbar="full" />',
      "}",
      "```",
    ].join("\n"),
    files: [...editorEntries, ...editorUiEntries, ...libEntries],
    name: "editor",
    title: "Pytah Editor",
    type: "registry:block",
  };
};

const createRegistryIndex = () => ({
  $schema: "https://ui.shadcn.com/schema/registry.json",
  items: [
    {
      description:
        "Copy/paste-ready Lexical editor with built-in chrome and extension points.",
      name: "editor",
      title: "Pytah Editor",
      type: "registry:block",
    },
  ],
  name: "pytah",
});

const writeJson = async (filePath, value) => {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const main = async () => {
  await mkdir(outputDirectory, { recursive: true });

  const [editorItem, registryIndex] = await Promise.all([
    createEditorItem(),
    createRegistryIndex(),
  ]);

  await Promise.all([
    writeJson(path.join(outputDirectory, "editor.json"), editorItem),
    writeJson(path.join(outputDirectory, "registry.json"), registryIndex),
  ]);
};

await main();
