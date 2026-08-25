import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const registryDirectory = path.join(projectRoot, "public", "r");

/**
 * Serves `public/r` over HTTP so the CLI resolves items and their
 * `registryDependencies` exactly like a published registry would.
 */
const startRegistryServer = () =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      const fileName = path.basename(url.pathname);
      const filePath = path.join(registryDirectory, fileName);

      readFile(filePath)
        .then((content) => {
          response.writeHead(200, {
            "access-control-allow-origin": "*",
            "content-type": "application/json",
          });
          response.end(content);
        })
        .catch(() => {
          response.writeHead(404);
          response.end("not found");
        });
    });

    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        close: () => server.close(),
        urlTemplate: `http://127.0.0.1:${port}/r/{name}.json`,
      });
    });
  });
const shadcnCliPath = path.join(
  projectRoot,
  "node_modules",
  "shadcn",
  "dist",
  "index.js"
);

const smokeCss = `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}
`;

const renderAppSource = (
  body
) => `import { Editor } from "@/components/editor/editor";

export default function App() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Registry smoke test</p>
          <h1 className="font-semibold text-2xl">Pytah Editor</h1>
        </div>
        ${body}
      </div>
    </main>
  );
}
`;

const baseAppSource = renderAppSource('<Editor minimal toolbar="full" />');

const fullAppSource = `import { Editor } from "@/components/editor/editor";
import { collapsibleFeature } from "@/components/editor/plugins/collapsible/feature";
import { seedContentFeature } from "@/components/editor/plugins/core/seed-content-feature";
import { draggableBlocksFeature } from "@/components/editor/plugins/draggable-block/feature";
import { excalidrawFeature } from "@/components/editor/plugins/excalidraw/feature";
import { imageFeature } from "@/components/editor/plugins/image/feature";
import { layoutFeature } from "@/components/editor/plugins/layout/feature";
import { mathFeature } from "@/components/editor/plugins/math/feature";
import { tableFeature } from "@/components/editor/plugins/table-behavior/feature";
import { tocFeature } from "@/components/editor/plugins/toc/feature";
import { youtubeFeature } from "@/components/editor/plugins/youtube/feature";

const features = [
  collapsibleFeature,
  seedContentFeature,
  draggableBlocksFeature,
  excalidrawFeature,
  imageFeature,
  layoutFeature,
  mathFeature,
  tableFeature,
  tocFeature,
  youtubeFeature,
];

export default function App() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Registry smoke test</p>
          <h1 className="font-semibold text-2xl">Pytah Editor</h1>
        </div>
        <Editor minimal toolbar="full" extraFeatures={features} />
      </div>
    </main>
  );
}
`;

const smokeComponentsJson = (registryUrlTemplate) => ({
  $schema: "https://ui.shadcn.com/schema.json",
  aliases: {
    components: "@/components",
    hooks: "@/hooks",
    lib: "@/lib",
    ui: "@/components/ui",
    utils: "@/lib/utils",
  },
  iconLibrary: "lucide",
  menuAccent: "subtle",
  menuColor: "default",
  registries: {
    "@pytah": registryUrlTemplate,
  },
  rsc: false,
  rtl: false,
  style: "base-nova",
  tailwind: {
    baseColor: "neutral",
    config: "",
    css: "src/index.css",
    cssVariables: true,
    prefix: "",
  },
  tsx: true,
});

const run = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`
        )
      );
    });
  });
};

const updateTsConfigApp = async (projectDirectory) => {
  const tsconfigPath = path.join(projectDirectory, "tsconfig.app.json");
  const source = await readFile(tsconfigPath, "utf8");
  const updatedSource = source.replace(
    '    "jsx": "react-jsx",\n',
    '    "jsx": "react-jsx",\n    "paths": {\n      "@/*": ["./src/*"]\n    },\n'
  );

  if (updatedSource === source) {
    throw new Error("Failed to inject path aliases into tsconfig.app.json");
  }

  await writeFile(tsconfigPath, updatedSource, "utf8");
};

const configureSmokeApp = async (projectDirectory, registryUrlTemplate) => {
  await Promise.all([
    updateTsConfigApp(projectDirectory),
    writeFile(
      path.join(projectDirectory, "components.json"),
      `${JSON.stringify(smokeComponentsJson(registryUrlTemplate), null, 2)}\n`,
      "utf8"
    ),
  ]);
};

const verifyInstalledFiles = async (projectDirectory, { withFeatures }) => {
  const expectedFiles = [
    path.join(projectDirectory, "src", "components", "editor", "editor.tsx"),
    path.join(
      projectDirectory,
      "src",
      "components",
      "editor",
      "core",
      "utils.ts"
    ),
    path.join(projectDirectory, "src", "components", "ui", "button.tsx"),
    path.join(projectDirectory, "src", "components", "ui", "tooltip.tsx"),
    path.join(projectDirectory, "src", "lib", "utils.ts"),
  ];

  if (withFeatures) {
    expectedFiles.push(
      path.join(
        projectDirectory,
        "src",
        "components",
        "editor",
        "plugins",
        "image",
        "feature.ts"
      ),
      path.join(
        projectDirectory,
        "src",
        "components",
        "editor",
        "plugins",
        "toc",
        "editor-with-toc.tsx"
      )
    );
  }

  await Promise.all(
    expectedFiles.map((filePath) => readFile(filePath, "utf8"))
  );
};

const scenarios = [
  {
    // The lean install: base editor only. Must never pull excalidraw/katex.
    appSource: baseAppSource,
    items: ["@pytah/editor"],
    name: "base",
    withFeatures: false,
  },
  {
    // Everything on: editor-full resolves every feature item through its
    // registryDependencies; the app composes all descriptors explicitly.
    appSource: fullAppSource,
    items: ["@pytah/editor-full"],
    name: "all-features",
    withFeatures: true,
  },
];

const runScenario = async (
  { appSource, items, name, withFeatures },
  registryUrlTemplate
) => {
  const tempRoot = await mkdtemp(
    path.join(tmpdir(), `pytah-registry-smoke-${name}-`)
  );
  const projectDirectory = path.join(tempRoot, "app");

  console.log(`[${name}] Creating smoke app in ${projectDirectory}`);

  try {
    await run(
      "bun",
      ["create", "vite", "app", "--template", "react-ts", "--no-interactive"],
      {
        cwd: tempRoot,
      }
    );
    await run("bun", ["install"], { cwd: projectDirectory });
    await run(
      "bun",
      ["add", "-d", "@tailwindcss/vite", "tailwindcss", "tw-animate-css"],
      { cwd: projectDirectory }
    );

    await configureSmokeApp(projectDirectory, registryUrlTemplate);
    await Promise.all([
      writeFile(
        path.join(projectDirectory, "src", "App.tsx"),
        appSource,
        "utf8"
      ),
      writeFile(
        path.join(projectDirectory, "src", "index.css"),
        smokeCss,
        "utf8"
      ),
      writeFile(
        path.join(projectDirectory, "vite.config.ts"),
        [
          'import tailwindcss from "@tailwindcss/vite";',
          'import react from "@vitejs/plugin-react";',
          'import { defineConfig } from "vite";',
          "",
          "export default defineConfig({",
          "  plugins: [tailwindcss(), react()],",
          "  resolve: {",
          "    alias: {",
          '      "@": new URL("./src", import.meta.url).pathname,',
          "    },",
          "  },",
          "});",
          "",
        ].join("\n"),
        "utf8"
      ),
    ]);

    for (const item of items) {
      await run(
        "node",
        [shadcnCliPath, "add", item, "-y", "--cwd", projectDirectory],
        {
          cwd: projectRoot,
        }
      );
    }

    await verifyInstalledFiles(projectDirectory, { withFeatures });
    await run("bun", ["run", "build"], { cwd: projectDirectory });

    console.log(`[${name}] Registry smoke test passed.`);
  } catch (error) {
    // Preserve the failing workspace for debugging.
    console.error(`[${name}] Smoke failed; keeping app at ${projectDirectory}`);
    throw error;
  }

  if (process.env.PYTAH_KEEP_SMOKE_APP === "1") {
    console.log(`[${name}] Keeping smoke app at ${projectDirectory}`);
    return;
  }

  await rm(tempRoot, { force: true, recursive: true });
};

const main = async () => {
  const { close, urlTemplate } = await startRegistryServer();

  try {
    for (const scenario of scenarios) {
      await runScenario(scenario, urlTemplate);
    }
  } finally {
    close();
  }

  console.log("Registry smoke test passed.");
};

await main();
