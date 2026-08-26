# Pytah — Guia de instalação para agents

Como instalar o editor Pytah (Lexical + React + shadcn/Base UI + Tailwind v4)
em uma aplicação React. Começa por **Next.js** e depois varia por framework.

Há dois métodos:

- **A — CLI do shadcn** (recomendado): `shadcn add` instala arquivos + deps + tokens automaticamente
- **B — Manual**: copie os arquivos você mesmo, passo a passo

> Pré-requisitos: React 19+, Tailwind CSS 4.x, shadcn/ui 4.x (inicializado com
> `components.json` e alias `@/` → `./src`).

---

## Next.js (App Router)

### Passo 1 — Crie o projeto

```bash
bun create next-app@latest my-editor-app --typescript --tailwind --app
cd my-editor-app
```

### Passo 2 — Inicialize o shadcn/ui

```bash
bunx shadcn@latest init
```

Isso cria o `components.json`, o alias `@/*` no tsconfig e os tokens CSS base.

---

## Método A — CLI do shadcn (recomendado)

### Passo 3A — Adicione os itens do registry

O registry é modular: `editor` é o núcleo enxuto e cada capability de conteúdo
(images, tabelas, drawings, TOC...) é um item opcional separado.

**Configure o namespace uma vez** no `components.json` do projeto consumidor:

```json
{
  "registries": {
    "@pytah": "http://localhost:5173/r/{name}.json"
  }
}
```

> Para produção, o namespace oficial é `https://pytah.vercel.app/r/{name}.json`.

Depois instale o núcleo e as features que quiser:

```bash
# núcleo (sempre):
bunx shadcn@latest add @pytah/editor

# features opcionais — instale só as que for usar:
bunx shadcn@latest add @pytah/editor-image
bunx shadcn@latest add @pytah/editor-tables
bunx shadcn@latest add @pytah/editor-excalidraw

# ou tudo de uma vez:
bunx shadcn@latest add @pytah/editor-full
```

Instalar via namespace é importante: os itens declaram
`registryDependencies` que só resolvem pelo namespace.

O item `editor` instala automaticamente:

- o core do editor (`src/components/editor/` sem as pastas de features)
- os primitivos `ui` necessários (`button`, `command`, `dialog`, `dropdown-menu`,
  `input`, `input-group`, `popover`, `separator`, `textarea`, `toggle`, `tooltip`)
- `theme-provider.tsx` + `theme-context.ts` (usados pelo code highlight)
- `lib/utils.ts` (helper `cn()`)
- apenas as dependências do core (`lexical`, `@lexical/*`, `@base-ui/react`,
  `cmdk`, ...) — nada de `@excalidraw/excalidraw` ou `katex`
- os tokens `--highlight` no CSS

Itens de feature trazem só os próprios arquivos e dependências
(`editor-excalidraw` → `@excalidraw/excalidraw`; `editor-math` → `katex`) e
puxam o `@pytah/editor` automaticamente.

### Passo 4 — Componha as features instaladas

Features não são flags: quem instala, compõe. Cada item exporta um descritor
pronto em `plugins/<feature>/feature.ts`:

```tsx
// src/app/page.tsx
import { Editor } from "@/components/editor/editor";
import { imageFeature } from "@/components/editor/plugins/image/feature";
import { tableFeature } from "@/components/editor/plugins/table-behavior/feature";
import { Providers } from "./providers";

export default function Page() {
  return (
    <Providers>
      <main className="min-h-screen bg-background text-foreground">
        <Editor
          extraFeatures={[imageFeature, tableFeature]}
          minimal
          toolbar="full"
        />
      </main>
    </Providers>
  );
}
```

Não importou o descritor? O código da feature não entra no bundle.

### Passo 5 — CSS: tokens base + `tw-animate-css`

> Se você rodou `shadcn init`, ele já gerou os tokens abaixo no seu
> `globals.css` — só confirme que existem e pule para o Passo 6.
>
> Se está partindo de um app Vite/Next limpo **sem** `init`, cole esta folha
> completa: as classes do editor (`bg-background`, `text-muted-foreground`,
> `ring-border`, ...) consomem essas variáveis. Sem elas o editor renderiza
> sem estilo nenhum.

```css
@import "tailwindcss";
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
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
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
  --highlight: oklch(0.97 0.05 90);
  --highlight-foreground: oklch(0.145 0 0);
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
  --highlight: oklch(0.35 0.06 85);
  --highlight-foreground: oklch(0.985 0 0);
}
```

Os tokens `--highlight` também são injetados automaticamente pelo
`shadcn add` (via `cssVars` do item) — mantê-los na folha não causa conflito.

### Passo 6 — Monte o ThemeProvider

O code highlight usa `useTheme()`, então o `ThemeProvider` deve envolver o
editor. Crie um client component:

```tsx
// src/app/providers.tsx
"use client";

import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

### Passo 7 — Valide

```bash
bun run build
bun run dev
```

Abra `/` — você deve ver o editor com a toolbar completa.

---

## Método B — Instalação manual

Use quando o `shadcn add` não estiver disponível ou você preferir controle total.

### Passo 3B — Instale as dependências

Core apenas (sem features de conteúdo):

```bash
bun add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/code \
  @lexical/code-shiki @lexical/link @lexical/table @lexical/html @lexical/markdown \
  @lexical/utils @lexical/selection @lexical/clipboard @lexical/history \
  @lexical/extension @base-ui/react \
  class-variance-authority clsx tailwind-merge \
  cmdk lucide-react tw-animate-css
```

Extras por feature: `@excalidraw/excalidraw` (drawings), `katex` (math).

### Passo 4B — Copie os arquivos do editor

Do repositório Pytah para o seu app, **preservando a estrutura de pastas**.
O core é tudo em `src/components/editor/` **exceto** as pastas de features que
você não quiser (`plugins/<feature>/`, `core/nodes/<feature>/` — remova aos
pares e apague o descritor correspondente):

```text
src/components/editor/          ← copie o diretório inteiro, menos features indesejadas
src/components/ui/              ← copie só estes primitivos:
    button.tsx
    command.tsx
    dialog.tsx
    dropdown-menu.tsx
    input.tsx
    input-group.tsx
    popover.tsx
    separator.tsx
    textarea.tsx
    toggle.tsx
    tooltip.tsx
src/components/theme-provider.tsx
src/components/theme-context.ts
src/lib/utils.ts
```

Não copie arquivos de teste (`*.test.ts`/`*.test.tsx`) nem arquivos `feature.ts`
de features que você removeu.

### Passo 5B — Alias `@/` (se ainda não existir)

No `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Passo 6B — Tokens CSS do editor

No `globals.css`, adicione os tokens `--highlight` (o `@theme inline` do shadcn
init já mapeia os `--color-*`, mas esses dois são extras do editor):

```css
:root {
  --highlight: oklch(0.97 0.05 90);
  --highlight-foreground: oklch(0.145 0 0);
}

.dark {
  --highlight: oklch(0.35 0.06 85);
  --highlight-foreground: oklch(0.985 0 0);
}
```

E registre no bloco `@theme inline` (junto dos tokens shadcn):

```css
@theme inline {
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
}
```

E garanta o import de `tw-animate-css` no topo:

```css
@import "tailwindcss";
@import "tw-animate-css";
```

### Passo 7B — Monte o ThemeProvider e renderize

Idêntico aos passos 5 e 6 do Método A (`providers.tsx` com `ThemeProvider` +
`<Editor minimal toolbar="full" />`).

### Passo 8B — Valide

```bash
bun run build
bun run dev
```

---

## Outros frameworks

O passo a passo é o mesmo, mudando só a configuração do Tailwind v4 e o alias.

### Vite

- Inicialize shadcn: `bunx shadcn@latest init`
- CLI: `bunx shadcn@latest add <url>/r/editor.json`
- Plugin Tailwind: `@tailwindcss/vite` no `vite.config.ts`
- Alias: `resolve.alias = { "@": "/src" }` + `paths` no `tsconfig.app.json`
- Método B: copie os mesmos arquivos de `src/` → `src/`

### Remix / Next.js Pages Router

- Mesmo `postcss.config` do Next App Router
- Alias `@/*` no `tsconfig.json`
- `ThemeProvider` + editor em um componente client

---

## Checklist rápido

**Método A (CLI):**

1. `bunx shadcn@latest init` no projeto
2. Namespace `@pytah` configurado no `components.json`
3. `@pytah/editor` + features desejadas instalados
4. Descritores das features compostos via `extraFeatures`
5. `tw-animate-css` importado no CSS
6. `ThemeProvider` envolvendo o editor
7. `bun run build` passando

**Método B (manual):**

1. Dependências do core instaladas (+ extras das features mantidas)
2. Tailwind v4 configurado (postcss ou plugin vite)
3. Arquivos copiados: core do `editor/`, `ui/*` (11 arquivos), `theme-provider.tsx`, `theme-context.ts`, `lib/utils.ts`
4. Alias `@/` → `./src` no tsconfig
5. Tokens `--highlight` no CSS + bridge `@theme inline`
6. `ThemeProvider` envolvendo o editor
7. `bun run build` passando
