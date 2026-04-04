import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const registryItemPath = path.join(projectRoot, "public", "r", "editor.json");
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

const smokeAppSource = `import { Editor } from "@/components/editor/editor";

export default function App() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">Registry smoke test</p>
          <h1 className="font-semibold text-2xl">Pytah Editor</h1>
        </div>
        <Editor minimal toolbar="full" />
      </div>
    </main>
  );
}
`;

const smokeComponentsJson = {
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
  registries: {},
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
};

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
    '    "jsx": "react-jsx",\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    },\n'
  );

  if (updatedSource === source) {
    throw new Error("Failed to inject path aliases into tsconfig.app.json");
  }

  await writeFile(tsconfigPath, updatedSource, "utf8");
};

const configureSmokeApp = async (projectDirectory) => {
  await Promise.all([
    updateTsConfigApp(projectDirectory),
    writeFile(
      path.join(projectDirectory, "components.json"),
      `${JSON.stringify(smokeComponentsJson, null, 2)}\n`,
      "utf8"
    ),
    writeFile(
      path.join(projectDirectory, "src", "App.tsx"),
      smokeAppSource,
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
};

const verifyInstalledFiles = async (projectDirectory) => {
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
    path.join(projectDirectory, "src", "lib", "utils.ts"),
  ];

  await Promise.all(
    expectedFiles.map((filePath) => readFile(filePath, "utf8"))
  );
};

const main = async () => {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "pytah-registry-smoke-"));
  const projectDirectory = path.join(tempRoot, "app");
  const keepTemp = process.env.PYTAH_KEEP_SMOKE_APP === "1";

  console.log(`Creating smoke app in ${projectDirectory}`);

  try {
    await run("bun", ["create", "vite", "app", "--template", "react-ts"], {
      cwd: tempRoot,
    });
    await run("bun", ["install"], { cwd: projectDirectory });
    await run(
      "bun",
      ["add", "-d", "@tailwindcss/vite", "tailwindcss", "tw-animate-css"],
      { cwd: projectDirectory }
    );
    await configureSmokeApp(projectDirectory);
    await run(
      "node",
      [shadcnCliPath, "add", registryItemPath, "-y", "--cwd", projectDirectory],
      { cwd: projectRoot }
    );
    await verifyInstalledFiles(projectDirectory);
    await run("bun", ["run", "build"], { cwd: projectDirectory });

    console.log("Registry smoke test passed.");
  } finally {
    if (keepTemp) {
      console.log(`Keeping smoke app at ${projectDirectory}`);
    } else {
      await rm(tempRoot, { force: true, recursive: true });
    }
  }
};

await main();
