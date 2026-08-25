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

### Passo 3A — Adicione o bloco do editor

```bash
# com o docs/dev server do Pytah rodando localmente:
bunx shadcn@latest add http://localhost:5173/r/editor.json

# ou apontando para o host publicado:
bunx shadcn@latest add https://your-domain.example/r/editor.json
```

O `shadcn add` instala automaticamente:

- todo o `src/components/editor/` (core + plugins + ui)
- os primitivos `ui` necessários (`button`, `command`, `dialog`, `dropdown-menu`,
  `input`, `input-group`, `popover`, `separator`, `textarea`, `toggle`, `tooltip`)
- `theme-provider.tsx` + `theme-context.ts` (usados pelo code highlight)
- `lib/utils.ts` (helper `cn()`)
- todas as dependências (`lexical`, `@lexical/*`, `@base-ui/react`, `cmdk`, ...)
- os tokens `--highlight` no CSS

### Passo 4 — CSS: `tw-animate-css`

O registry não injeta o `tw-animate-css`. Adicione o import no `globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
```

### Passo 5 — Monte o ThemeProvider

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

### Passo 6 — Renderize o editor

O editor já declara `"use client"` internamente, então pode ser importado
diretamente de um Server Component:

```tsx
// src/app/page.tsx
import { Editor } from "@/components/editor/editor";
import { Providers } from "./providers";

export default function Page() {
  return (
    <Providers>
      <main className="min-h-screen bg-background text-foreground">
        <Editor minimal toolbar="full" />
      </main>
    </Providers>
  );
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

```bash
bun add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/code \
  @lexical/code-shiki @lexical/link @lexical/table @lexical/html @lexical/markdown \
  @lexical/utils @lexical/selection @lexical/clipboard @lexical/history \
  @lexical/extension @base-ui/react @excalidraw/excalidraw katex \
  class-variance-authority clsx tailwind-merge \
  cmdk lucide-react tw-animate-css
```

### Passo 4B — Copie os arquivos do editor

Do repositório Pytah para o seu app, **preservando a estrutura de pastas**:

```text
src/components/editor/          ← copie o diretório inteiro
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

Não copie arquivos de teste (`*.test.ts`/`*.test.tsx`).

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
2. `bunx shadcn@latest add <url>/r/editor.json`
3. `tw-animate-css` importado no CSS
4. `ThemeProvider` envolvendo o editor
5. `bun run build` passando

**Método B (manual):**

1. Dependências instaladas (incluindo `tw-animate-css` e `katex`)
2. Tailwind v4 configurado (postcss ou plugin vite)
3. Arquivos copiados: `editor/`, `ui/*` (11 arquivos), `theme-provider.tsx`, `theme-context.ts`, `lib/utils.ts`
4. Alias `@/` → `./src` no tsconfig
5. Tokens `--highlight` no CSS + bridge `@theme inline`
6. `ThemeProvider` envolvendo o editor
7. `bun run build` passando
