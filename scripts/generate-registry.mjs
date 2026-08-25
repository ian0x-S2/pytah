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
const componentsSourceDirectory = path.join(projectRoot, "src", "components");
const compatibilityMetadataPath = path.join(
  editorSourceDirectory,
  "core",
  "compatibility.json"
);

const editorUiFiles = [
  "button.tsx",
  "command.tsx",
  "dialog.tsx",
  "dropdown-menu.tsx",
  "input.tsx",
  "input-group.tsx",
  "popover.tsx",
  "separator.tsx",
  "textarea.tsx",
  "toggle.tsx",
  "tooltip.tsx",
];

/**
 * Optional content features. Each entry becomes its own registry item that
 * ships exactly the listed source folders plus the npm dependencies those
 * files actually import — installing the base editor never pulls
 * `@excalidraw/excalidraw` or `katex` unless a feature item asks for them.
 */
const featureItems = [
  {
    description:
      "Collapsible sections with toggle titles, indentation flows and slash-command insertion.",
    folders: ["plugins/collapsible", "core/nodes/collapsible"],
    name: "editor-collapsible",
    title: "Pytah Editor — Collapsible Sections",
  },
  {
    description:
      "Drag handles with drop indicators for reordering top-level blocks.",
    folders: ["plugins/draggable-block"],
    name: "editor-draggable-blocks",
    title: "Pytah Editor — Draggable Blocks",
  },
  {
    description:
      "Excalidraw drawing blocks with resize handles and modal editing.",
    folders: ["plugins/excalidraw", "core/nodes/excalidraw"],
    name: "editor-excalidraw",
    title: "Pytah Editor — Drawings",
  },
  {
    description:
      "Image embeds with URL/file dialogs, alignment controls, paste and drag-drop upload.",
    folders: ["plugins/image", "core/nodes/image"],
    name: "editor-image",
    title: "Pytah Editor — Images",
  },
  {
    description:
      "Multi-column layout containers with preset templates and column controls.",
    folders: ["plugins/layout", "core/nodes/layout"],
    name: "editor-layouts",
    title: "Pytah Editor — Layouts",
  },
  {
    description: "Inline and block TeX math rendered with KaTeX.",
    folders: ["plugins/math", "core/nodes/math"],
    name: "editor-math",
    title: "Pytah Editor — Math",
  },
  {
    description:
      "Seeds the example document when the editor mounts empty. Intended for demos.",
    folders: [
      "plugins/core/seed-content.tsx",
      "plugins/core/seed-content-feature.ts",
    ],
    name: "editor-seed-content",
    title: "Pytah Editor — Seed Content",
  },
  {
    description:
      "Table cell menus, row/column actions and merge controls. Insertion and paste stay in the base editor.",
    folders: ["plugins/table-behavior"],
    name: "editor-tables",
    title: "Pytah Editor — Table Behavior",
  },
  {
    description:
      "Table-of-contents sidebar with active-heading tracking, plus an EditorWithToc composition wrapper.",
    folders: ["plugins/toc"],
    name: "editor-toc",
    title: "Pytah Editor — Table of Contents",
  },
  {
    description: "YouTube embeds with URL dialog and markdown link support.",
    folders: ["plugins/youtube", "core/nodes/youtube"],
    name: "editor-youtube",
    title: "Pytah Editor — YouTube",
  },
];

const registryPathPrefix = "registry/pytah/editor";

/**
 * Namespace used inside `registryDependencies`. Consumers map it to the
 * hosted URL template in their `components.json`:
 *
 *   "registries": { "@pytah": "https://host/r/{name}.json" }
 */
const registryNamespace = process.env.PYTAH_REGISTRY_NAMESPACE ?? "@pytah";

const readJson = async (filePath) => {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
};

const toPosixPath = (value) => value.split(path.sep).join(path.posix.sep);

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });

  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }

    if (
      !(
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".css")
      )
    ) {
      continue;
    }

    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
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

// Static import/export statements only. Anchored so prose like "# Markdown
// import" inside string constants never produces a false dependency.
const FROM_IMPORT_PATTERN =
  /(?:^|\n)(?:import|export)[\s\S]*?\bfrom\s*["']([^"']+)["']/g;
const SIDE_EFFECT_IMPORT_PATTERN = /(?:^|\n)\s*import\s*["']([^"']+)["']/g;
const DYNAMIC_IMPORT_PATTERN = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

const collectFileImports = (content) => {
  const specifiers = [];

  for (const pattern of [
    FROM_IMPORT_PATTERN,
    SIDE_EFFECT_IMPORT_PATTERN,
    DYNAMIC_IMPORT_PATTERN,
  ]) {
    for (const match of content.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
};

/**
 * Resolves the npm dependencies a set of files actually imports, so every
 * registry item declares exactly what its code needs — nothing more.
 */
const resolveFileDependencies = async (files) => {
  const packageJson = await readJson(path.join(projectRoot, "package.json"));
  const packageNames = new Set();

  for (const file of files) {
    const content = await readFile(file, "utf8");

    for (const specifier of collectFileImports(content)) {
      if (specifier.startsWith(".") || specifier.startsWith("@/")) {
        continue;
      }

      const segments = specifier.split("/");
      const packageName = specifier.startsWith("@")
        ? segments.slice(0, 2).join("/")
        : segments[0];
      packageNames.add(packageName);
    }
  }

  const names = [...packageNames]
    .filter((name) => !name.startsWith("@types/"))
    .sort((left, right) => left.localeCompare(right));

  return names.map((name) => {
    const version =
      packageJson.dependencies[name] ?? packageJson.devDependencies[name];

    if (!version) {
      throw new Error(`Missing dependency version for ${name}`);
    }

    return `${name}@${version}`;
  });
};

const createComponentEntry = (absolutePath) => {
  const relativePath = path.relative(componentsSourceDirectory, absolutePath);
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
};

const isFeatureFile = (absolutePath) => {
  const editorRelativePath = toPosixPath(
    path.relative(editorSourceDirectory, absolutePath)
  );

  return featureItems.some((feature) =>
    feature.folders.some(
      (folder) =>
        editorRelativePath === folder ||
        editorRelativePath.startsWith(`${folder}/`)
    )
  );
};

const getCompatibilityMetadata = () => readJson(compatibilityMetadataPath);

const getCoreEditorEntries = async () => {
  const editorFiles = await collectSourceFiles(editorSourceDirectory);

  return Promise.all(
    editorFiles.filter((file) => !isFeatureFile(file)).map(createComponentEntry)
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
    createRegistryFileEntry({
      absolutePath: path.join(
        projectRoot,
        "src",
        "components",
        "theme-provider.tsx"
      ),
      registryPath: path.posix.join(
        registryPathPrefix,
        "components",
        "theme-provider.tsx"
      ),
      target: path.posix.join("src", "components", "theme-provider.tsx"),
    }),
    createRegistryFileEntry({
      absolutePath: path.join(
        projectRoot,
        "src",
        "components",
        "theme-context.ts"
      ),
      registryPath: path.posix.join(
        registryPathPrefix,
        "components",
        "theme-context.ts"
      ),
      target: path.posix.join("src", "components", "theme-context.ts"),
    }),
  ]);
};

const getFeatureFolderFiles = async (feature) => {
  const files = [];

  for (const folder of feature.folders) {
    const absolutePath = path.join(editorSourceDirectory, folder);

    if (absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")) {
      files.push(absolutePath);
      continue;
    }

    files.push(...(await collectSourceFiles(absolutePath)));
  }

  return files.sort((left, right) => left.localeCompare(right));
};

const createFeatureItem = async (feature) => {
  const files = await getFeatureFolderFiles(feature);

  const entries = await Promise.all(files.map(createComponentEntry));

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    author: "Pytah",
    categories: ["editor"],
    dependencies: await resolveFileDependencies(files),
    description: feature.description,
    files: entries,
    name: feature.name,
    registryDependencies: [`${registryNamespace}/editor`],
    title: feature.title,
    type: "registry:block",
  };
};

const createBaseItem = async ({
  compatibility,
  coreEntries,
  libEntries,
  uiEntries,
}) => {
  const baseFiles = (await collectSourceFiles(editorSourceDirectory)).filter(
    (file) => !isFeatureFile(file)
  );

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
    dependencies: await resolveFileDependencies([
      ...baseFiles,
      ...libEntries.map((entry) =>
        path.join(projectRoot, "src", entry.target.replace("src/", ""))
      ),
      ...uiEntries.map((entry) =>
        path.join(projectRoot, "src", entry.target.replace("src/", ""))
      ),
    ]),
    description:
      "Copy/paste-ready Lexical editor core with chrome, slash menu, links and markdown/html interop. Pair with optional feature items (images, tables, drawings, ...) for content capabilities.",
    docs: [
      `Install into a React ${compatibility.requirements.react} + Tailwind CSS ${compatibility.requirements.tailwind} + shadcn/ui ${compatibility.requirements.shadcn} project.`,
      "",
      "The item writes to your configured `components`, `ui`, and `lib` aliases.",
      "It expects the standard `@/` alias contract from `components.json`.",
      compatibility.notes.animate,
      `The editor is currently validated against Lexical ${compatibility.requirements.lexical}.`,
      "",
      "Optional content features ship as separate items (`editor-image`, `editor-tables`, ...).",
      "Install what you need and compose it through the `extraFeatures` prop:",
      "```tsx",
      'import { Editor } from "@/components/editor/editor"',
      'import { imageFeature } from "@/components/editor/plugins/image/feature"',
      "",
      "export function Page() {",
      '  return <Editor minimal toolbar="full" extraFeatures={[imageFeature]} />',
      "}",
      "```",
    ].join("\n"),
    files: [...coreEntries, ...uiEntries, ...libEntries],
    name: "editor",
    title: "Pytah Editor",
    type: "registry:block",
  };
};

const writeJson = async (filePath, value) => {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const main = async () => {
  await mkdir(outputDirectory, { recursive: true });

  const [compatibility, coreEntries, uiEntries, libEntries] = await Promise.all(
    [
      getCompatibilityMetadata(),
      getCoreEditorEntries(),
      getEditorUiEntries(),
      getLibEntries(),
    ]
  );

  const baseItem = await createBaseItem({
    compatibility,
    coreEntries,
    libEntries,
    uiEntries,
  });

  const items = await Promise.all(featureItems.map(createFeatureItem));

  const fullItem = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    author: "Pytah",
    categories: ["editor"],
    description:
      "Every optional Pytah editor feature in one install. Compose descriptors through the `extraFeatures` prop.",
    files: [],
    name: "editor-full",
    registryDependencies: featureItems.map(
      (feature) => `${registryNamespace}/${feature.name}`
    ),
    title: "Pytah Editor — All Features",
    type: "registry:block",
  };

  const registryIndex = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    items: [baseItem, fullItem, ...items].map((item) => ({
      description: item.description,
      name: item.name,
      title: item.title,
      type: item.type,
    })),
    name: "pytah",
  };

  await Promise.all([
    writeJson(path.join(outputDirectory, "editor.json"), baseItem),
    writeJson(path.join(outputDirectory, "editor-full.json"), fullItem),
    ...items.map((item) =>
      writeJson(path.join(outputDirectory, `${item.name}.json`), item)
    ),
    writeJson(path.join(outputDirectory, "registry.json"), registryIndex),
  ]);
};

await main();
