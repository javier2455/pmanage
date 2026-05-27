# Guía de Sistema de Diseño y Estructura — pmanage → psearch

Esta guía describe **exactamente** cómo está construido el proyecto `pmanage` para que puedas replicar la misma identidad visual, colores, tipografía, componentes y arquitectura de carpetas en el proyecto `psearch`.

Pasa este archivo completo a tu agente en la otra ventana junto con la instrucción: *"Implementa el sistema de diseño y la estructura descritos aquí en este proyecto. Respeta nombres de tokens, variables CSS y convenciones de archivos."*

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | **Next.js** (App Router) | 16.x |
| Runtime React | React 19 + React Compiler | `babel-plugin-react-compiler` activo |
| Lenguaje | TypeScript (strict) | 5.x |
| Estilos | **Tailwind CSS v4** (`@import "tailwindcss"`) + PostCSS | 4.x |
| Componentes base | **shadcn/ui** estilo **`new-york`** + Radix UI | — |
| Iconos | **`lucide-react`** | 0.562.x |
| Formularios | `react-hook-form` + `zod` + `@hookform/resolvers` | — |
| Estado servidor | `@tanstack/react-query` | 5.x |
| Tablas | `@tanstack/react-table` | 8.x |
| HTTP | `axios` con interceptores (refresh token) | — |
| Toasts | **`sileo`** (notificaciones) | — |
| Tema (oscuro/claro) | `next-themes` | — |
| Tipografía | **Poppins** (Google Fonts, 400/500/600/700) | — |
| Otros | `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `date-fns`, `recharts`, `zustand` | — |

Gestor de paquetes: **pnpm** con `pnpm-workspace.yaml` (workspace simple).

---

## 2. Identidad Visual

### 2.1 Tipografía

- **Fuente principal**: `Poppins` (importada vía `<link>` desde Google Fonts en `src/app/layout.tsx`).
- Pesos cargados: `400, 500, 600, 700`.
- Aplicada globalmente con `body { font-family: 'Poppins', sans-serif; }` en `globals.css`.
- Body usa `className="antialiased"`.

### 2.2 Paleta de Colores (HSL — clave de la identidad)

El color **primario** es **verde esmeralda** `hsl(160 84% 39%)` (similar al verde "emerald-600"). Todo el branding gira en torno a ese verde + grises azulados neutros.

#### Modo claro (`:root`)

| Token | Valor HSL | Uso |
|---|---|---|
| `--background` | `210 20% 98%` | Fondo general (gris muy claro) |
| `--foreground` | `215 25% 10%` | Texto principal (casi negro azulado) |
| `--card` | `0 0% 100%` | Fondo de tarjetas (blanco puro) |
| `--card-foreground` | `215 25% 10%` | Texto sobre tarjeta |
| `--popover` | `0 0% 100%` | Popovers / menús |
| `--popover-foreground` | `215 25% 10%` | — |
| `--primary` | `160 84% 39%` | **Verde esmeralda — botones, links, acento** |
| `--primary-foreground` | `0 0% 100%` | Texto sobre primario (blanco) |
| `--secondary` | `210 15% 94%` | Gris suave |
| `--secondary-foreground` | `215 20% 20%` | — |
| `--muted` | `210 15% 94%` | Fondos secundarios |
| `--muted-foreground` | `215 12% 50%` | Texto secundario, placeholders |
| `--accent` | `160 84% 39%` | Igual que primary |
| `--accent-foreground` | `0 0% 100%` | — |
| `--destructive` | `0 72% 51%` | Rojo de borrado / error |
| `--destructive-foreground` | `0 0% 100%` | — |
| `--border` | `214 20% 88%` | Bordes |
| `--input` | `214 20% 88%` | Bordes de inputs |
| `--ring` | `160 84% 39%` | Ring de focus (verde) |
| `--chart-1` | `160 84% 39%` | Verde |
| `--chart-2` | `199 89% 48%` | Azul cielo |
| `--chart-3` | `43 96% 56%` | Amarillo |
| `--chart-4` | `0 72% 51%` | Rojo |
| `--chart-5` | `262 83% 58%` | Violeta |
| `--radius` | `0.5rem` | Radio base (cards usan `rounded-xl`, botones `rounded-md`) |

Sidebar (tokens propios, iguales en estructura):
- `--sidebar-background`: `0 0% 100%` (blanco)
- `--sidebar-foreground`: `215 25% 10%`
- `--sidebar-primary`: `160 84% 39%`
- `--sidebar-primary-foreground`: `0 0% 100%`
- `--sidebar-accent`: `210 15% 94%`
- `--sidebar-accent-foreground`: `215 25% 10%`
- `--sidebar-border`: `214 20% 88%`
- `--sidebar-ring`: `160 84% 39%`

#### Modo oscuro (`.dark`)

| Token | Valor HSL |
|---|---|
| `--background` | `215 28% 7%` |
| `--foreground` | `210 20% 95%` |
| `--card` | `215 25% 10%` |
| `--card-foreground` | `210 20% 95%` |
| `--popover` | `215 25% 10%` |
| `--popover-foreground` | `210 20% 95%` |
| `--primary` | `160 84% 39%` *(igual — el verde se mantiene)* |
| `--primary-foreground` | `0 0% 100%` |
| `--secondary` | `215 20% 15%` |
| `--secondary-foreground` | `210 20% 90%` |
| `--muted` | `215 20% 15%` |
| `--muted-foreground` | `215 12% 55%` |
| `--accent` | `160 84% 39%` |
| `--accent-foreground` | `0 0% 100%` |
| `--destructive` | `0 72% 51%` |
| `--destructive-foreground` | `0 0% 100%` |
| `--border` | `215 20% 18%` |
| `--input` | `215 20% 18%` |
| `--ring` | `160 84% 39%` |
| `--sidebar-background` | `215 28% 8%` |
| `--sidebar-foreground` | `214 20% 85%` |
| `--sidebar-accent` | `215 25% 20%` |
| `--sidebar-accent-foreground` | `210 20% 98%` |
| `--sidebar-border` | `215 20% 25%` |

### 2.3 Reglas globales

```css
* { border-color: hsl(var(--border)); }
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow-x: hidden;
}
```

---

## 3. Configuración a Copiar Literalmente

### 3.1 `src/app/globals.css` (archivo completo)

```css
@import "tailwindcss";

body {
  font-family: 'Poppins', sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@theme {
  --color-background: hsl(210 20% 98%);
  --color-foreground: hsl(215 25% 10%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(215 25% 10%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(215 25% 10%);
  --color-primary: hsl(160 84% 39%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(210 15% 94%);
  --color-secondary-foreground: hsl(215 20% 20%);
  --color-muted: hsl(210 15% 94%);
  --color-muted-foreground: hsl(215 12% 50%);
  --color-accent: hsl(160 84% 39%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 72% 51%);
  --color-destructive-foreground: hsl(0 0% 100%);
  --color-border: hsl(214 20% 88%);
  --color-input: hsl(214 20% 88%);
  --color-ring: hsl(160 84% 39%);
  --color-sidebar-background: hsl(0 0% 100%);
  --color-sidebar-foreground: hsl(215 25% 10%);
  --color-sidebar-primary: hsl(160 84% 39%);
  --color-sidebar-primary-foreground: hsl(0 0% 100%);
  --color-sidebar-accent: hsl(210 15% 94%);
  --color-sidebar-accent-foreground: hsl(215 25% 10%);
  --color-sidebar-border: hsl(214 20% 88%);
  --color-sidebar-ring: hsl(160 84% 39%);
}

@layer base {
  :root {
    --background: 210 20% 98%;
    --foreground: 215 25% 10%;
    --card: 0 0% 100%;
    --card-foreground: 215 25% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 215 25% 10%;
    --primary: 160 84% 39%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 15% 94%;
    --secondary-foreground: 215 20% 20%;
    --muted: 210 15% 94%;
    --muted-foreground: 215 12% 50%;
    --accent: 160 84% 39%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 20% 88%;
    --input: 214 20% 88%;
    --ring: 160 84% 39%;
    --chart-1: 160 84% 39%;
    --chart-2: 199 89% 48%;
    --chart-3: 43 96% 56%;
    --chart-4: 0 72% 51%;
    --chart-5: 262 83% 58%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 215 25% 10%;
    --sidebar-primary: 160 84% 39%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 210 15% 94%;
    --sidebar-accent-foreground: 215 25% 10%;
    --sidebar-border: 214 20% 88%;
    --sidebar-ring: 160 84% 39%;
  }
  .dark {
    --color-background: hsl(215 28% 7%);
    --color-foreground: hsl(210 20% 95%);
    --color-card: hsl(215 25% 10%);
    --color-card-foreground: hsl(210 20% 95%);
    --color-popover: hsl(215 25% 10%);
    --color-popover-foreground: hsl(210 20% 95%);
    --color-primary: hsl(160 84% 39%);
    --color-primary-foreground: hsl(0 0% 100%);
    --color-secondary: hsl(215 20% 15%);
    --color-secondary-foreground: hsl(210 20% 90%);
    --color-muted: hsl(215 20% 15%);
    --color-muted-foreground: hsl(215 12% 55%);
    --color-accent: hsl(160 84% 39%);
    --color-accent-foreground: hsl(0 0% 100%);
    --color-destructive: hsl(0 72% 51%);
    --color-destructive-foreground: hsl(0 0% 100%);
    --color-border: hsl(215 20% 18%);
    --color-input: hsl(215 20% 18%);
    --color-ring: hsl(160 84% 39%);
    --color-sidebar-background: hsl(215 28% 8%);
    --color-sidebar-foreground: hsl(214 20% 85%);
    --color-sidebar-primary: hsl(160 84% 39%);
    --color-sidebar-primary-foreground: hsl(0 0% 100%);
    --color-sidebar-accent: hsl(215 25% 20%);
    --color-sidebar-accent-foreground: hsl(210 20% 98%);
    --color-sidebar-border: hsl(215 20% 25%);
    --color-sidebar-ring: hsl(160 84% 39%);
    --background: 215 28% 7%;
    --foreground: 210 20% 95%;
    --card: 215 25% 10%;
    --card-foreground: 210 20% 95%;
    --popover: 215 25% 10%;
    --popover-foreground: 210 20% 95%;
    --primary: 160 84% 39%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 20% 15%;
    --secondary-foreground: 210 20% 90%;
    --muted: 215 20% 15%;
    --muted-foreground: 215 12% 55%;
    --accent: 160 84% 39%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 215 20% 18%;
    --input: 215 20% 18%;
    --ring: 160 84% 39%;
    --chart-1: 160 84% 39%;
    --chart-2: 199 89% 48%;
    --chart-3: 43 96% 56%;
    --chart-4: 0 72% 51%;
    --chart-5: 262 83% 58%;
    --sidebar-background: 215 28% 8%;
    --sidebar-foreground: 214 20% 85%;
    --sidebar-primary: 160 84% 39%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 215 25% 20%;
    --sidebar-accent-foreground: 210 20% 98%;
    --sidebar-border: 215 20% 25%;
    --sidebar-ring: 160 84% 39%;
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    overflow-x: hidden;
  }
}
```

> Nota: el bloque `@theme` es de **Tailwind v4** (sintaxis CSS-first, **sin `tailwind.config.js`**). Los tokens HSL crudos en `:root` permiten interpolación dinámica con `hsl(var(--token))`.

### 3.2 `components.json` (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": false,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 3.3 `postcss.config.mjs`

```js
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};
export default config;
```

### 3.4 `tsconfig.json` — paths

```json
"paths": { "@/*": ["./src/*"] }
```

### 3.5 `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3.6 `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/next-themes";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sileo";

export const metadata: Metadata = {
  title: "psearch",
  description: "Tu descripción aquí",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Toaster position="bottom-right" />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 4. Estructura de Carpetas

```
psearch/
├─ src/
│  ├─ app/                          # Next App Router
│  │  ├─ (auth)/                    # Grupo de rutas sin layout dashboard
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  ├─ forgot-password/page.tsx
│  │  │  ├─ reset-password/page.tsx
│  │  │  └─ verify/page.tsx
│  │  ├─ dashboard/
│  │  │  ├─ layout.tsx              # Layout con Sidebar + Topbar
│  │  │  ├─ page.tsx                # Home del dashboard
│  │  │  ├─ loading.tsx
│  │  │  ├─ error.tsx
│  │  │  └─ <feature>/              # Una carpeta por feature
│  │  │     ├─ page.tsx
│  │  │     ├─ create/page.tsx
│  │  │     ├─ edit/[id]/page.tsx
│  │  │     └─ [id]/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx                 # Root layout (theme + query + fonts)
│  │  └─ page.tsx                   # redirect a /login
│  │
│  ├─ components/
│  │  ├─ ui/                        # Primitivos shadcn (no tocar salvo tokens)
│  │  │  ├─ button.tsx
│  │  │  ├─ card.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ label.tsx
│  │  │  ├─ dialog.tsx
│  │  │  ├─ dropdown-menu.tsx
│  │  │  ├─ select.tsx
│  │  │  ├─ table.tsx
│  │  │  ├─ tabs.tsx
│  │  │  ├─ tooltip.tsx
│  │  │  ├─ popover.tsx
│  │  │  ├─ sheet.tsx
│  │  │  ├─ sidebar.tsx            # Sidebar shadcn (clave)
│  │  │  ├─ skeleton.tsx
│  │  │  ├─ separator.tsx
│  │  │  ├─ badge.tsx
│  │  │  ├─ checkbox.tsx
│  │  │  ├─ combobox.tsx
│  │  │  ├─ command.tsx
│  │  │  ├─ calendar.tsx
│  │  │  ├─ pagination.tsx
│  │  │  ├─ textarea.tsx
│  │  │  ├─ avatar.tsx
│  │  │  ├─ chart.tsx
│  │  │  ├─ collapsible.tsx
│  │  │  ├─ empty.tsx
│  │  │  └─ phone-input.tsx
│  │  ├─ sidebar/                  # Composiciones del sidebar de la app
│  │  │  ├─ sidebar.tsx            # AppSidebar
│  │  │  ├─ nav-main.tsx
│  │  │  └─ nav-user.tsx
│  │  ├─ providers/
│  │  │  └─ query-provider.tsx     # React Query client + staleTimes
│  │  ├─ next-themes.tsx           # Re-export de next-themes
│  │  ├─ data-table/               # Composables de tabla (paginación, etc.)
│  │  ├─ generic/                  # Skeletons, helpers genéricos
│  │  ├─ <feature>/                # Componentes por feature
│  │  │  ├─ <feature>-table.tsx
│  │  │  ├─ <feature>-table-columns.tsx
│  │  │  ├─ <feature>-form.tsx
│  │  │  └─ <feature>-details-dialog.tsx
│  │  └─ delete-dialog.tsx         # Dialog reutilizable
│  │
│  ├─ context/                     # Contexts globales (ej: business-context)
│  ├─ hooks/                       # Hooks (use-<feature>.ts → React Query)
│  ├─ lib/
│  │  ├─ api/                      # Funciones fetch (1 archivo por recurso)
│  │  ├─ routes/                   # Constantes de URLs API
│  │  │  └─ index.ts               # export const BASIC_ROUTE = '...'
│  │  ├─ types/                    # Tipos por recurso
│  │  ├─ validations/              # Schemas zod por recurso
│  │  ├─ axios.ts                  # apiClient con interceptores
│  │  ├─ cookies.ts                # set/clear auth cookies
│  │  ├─ icon-map.ts               # mapa string → LucideIcon
│  │  ├─ toast.ts                  # Helpers sileo
│  │  └─ utils.ts                  # cn()
│  ├─ fonts/                       # (opcional) fuentes locales
│  └─ middleware.ts                # Auth guard de rutas
└─ public/
```

---

## 5. Convenciones por Feature

Cada feature/recurso (ej. `users`, `searches`, `reports`) sigue **el mismo patrón de 5 archivos**:

| Capa | Ruta | Responsabilidad |
|---|---|---|
| Rutas | `src/lib/routes/<feature>.ts` | `export const xRoutes = { getAll: ..., getById: (id) => ..., create: ..., update: (id) => ..., delete: (id) => ... }` |
| Tipos | `src/lib/types/<feature>.ts` | `type X`, `CreateXProps`, `UpdateXProps`, `GetAllXParams`, `GetAllXResponse`, etc. |
| Validación | `src/lib/validations/<feature>.ts` | Schemas `zod` + `z.infer` types |
| API | `src/lib/api/<feature>.ts` | Funciones `getAllX`, `getXById`, `createX`, `updateX`, `deleteX` usando `apiClient` |
| Hook | `src/hooks/use-<feature>.ts` | `useGetAllXQuery`, `useGetXByIdQuery`, `useCreateXMutation`, `useUpdateXMutation`, `useDeleteXMutation` con `useQueryClient.invalidateQueries` |
| UI | `src/components/<feature>/*` y `src/app/dashboard/<feature>/*` | Tabla, formulario, página |

### Ejemplo de hook (patrón fijo)

```ts
// src/hooks/use-provider.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProvider, deleteProvider, getAllProviders, getProviderById, updateProvider } from "@/lib/api/provider";

export function useGetAllProvidersQuery(params = {}) {
  return useQuery({
    queryKey: ["all-providers", params],
    queryFn: () => getAllProviders(params),
    placeholderData: keepPreviousData,
    enabled: params.businessId === undefined || !!params.businessId,
  });
}

export function useCreateProviderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createProvider(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-providers"] }),
  });
}
```

### Ejemplo de routes

```ts
// src/lib/routes/index.ts
export const BASIC_ROUTE = 'https://psearch.dveloxsoft.com/api/v2'

// src/lib/routes/provider.ts
import { BASIC_ROUTE } from ".";
export const providerRoutes = {
  getAllProviders: `${BASIC_ROUTE}/providers/`,
  getProviderById: (id: string) => `${BASIC_ROUTE}/providers/${id}`,
  createProvider: `${BASIC_ROUTE}/providers/`,
  updateProvider: (id: string) => `${BASIC_ROUTE}/providers/${id}`,
  deleteProvider: (id: string) => `${BASIC_ROUTE}/providers/${id}`,
};
```

### Validaciones con zod (mensajes en español)

```ts
import { z } from "zod";
export const createXSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255, "Máximo 255 caracteres"),
  email: z.string().email("Email inválido").nullable().or(z.literal("")).optional(),
});
export type CreateXFormData = z.infer<typeof createXSchema>;
```

---

## 6. Layout del Dashboard

```tsx
// src/app/dashboard/layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="bg-background flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <nav className="flex items-center gap-2 p-4">
          <SidebarTrigger />
          {/* topbar content */}
        </nav>
        {children}
      </main>
    </SidebarProvider>
  )
}
```

**Características clave del Sidebar**:
- Componente `sidebar.tsx` de shadcn (idéntico al oficial — copialo tal cual desde `pmanage/src/components/ui/sidebar.tsx`).
- Anchos: `--sidebar-width: 16rem`, `--sidebar-width-icon: 3rem`, mobile `18rem`.
- Atajo teclado: **Ctrl/Cmd + B** para colapsar.
- Persiste estado en cookie `sidebar_state` (7 días).
- Colapsable a iconos (`collapsible="icon"`).
- En mobile usa `Sheet` (drawer lateral).
- Header con logo cuadrado en fondo `bg-sidebar-primary` (verde) y texto blanco.

---

## 7. Componentes UI Principales (snippets)

### 7.1 Button (variantes y tamaños)

```tsx
// Variantes: default | destructive | outline | secondary | ghost | link
// Tamaños: default(h-9) | xs(h-6) | sm(h-8) | lg(h-10) | icon(size-9) | icon-xs | icon-sm | icon-lg
// Default = bg-foreground text-background (NO usa primary por defecto)
// Para CTA principal usa: <Button className="bg-primary text-primary-foreground">
```

Detalles:
- `rounded-md`, `text-sm font-medium`, `cursor-pointer`, `transition-all`.
- Focus: `focus-visible:ring-ring/30 focus-visible:ring-[3px]`.
- Iconos auto-tamaño: `[&_svg:not([class*='size-'])]:size-4`.

### 7.2 Card

```tsx
<Card>                                 // rounded-xl, border, shadow-sm, gap-6, py-6
  <CardHeader>                         // px-6, gap-2
    <CardTitle>...</CardTitle>         // leading-none font-semibold
    <CardDescription>...</CardDescription> // text-muted-foreground text-sm
  </CardHeader>
  <CardContent>...</CardContent>       // px-6
  <CardFooter>...</CardFooter>         // px-6 flex items-center
</Card>
```

### 7.3 Input

```tsx
// h-9, rounded-md, border-input, bg-transparent, shadow-xs
// focus: focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px]
// invalid: aria-invalid:border-destructive aria-invalid:ring-destructive/20
// Pattern común: input con icono → wrapper `relative` + Icon `absolute left-3 top-1/2 -translate-y-1/2` + `<Input className="pl-9">`
```

### 7.4 Badge

Variantes: `default | secondary | destructive | outline | ghost | link`. Pill (`rounded-full`).

---

## 8. Patrones de UI Recurrentes

### 8.1 Header de página

```tsx
<section className="flex flex-col gap-8">
  <div>
    <h1 className="text-2xl font-bold tracking-tight text-foreground">Título</h1>
    <p className="text-muted-foreground">Descripción corta</p>
    <div className="mb-4 mt-4 flex items-center justify-end">
      <Button asChild>
        <Link href="/dashboard/x/create">
          <Plus /> Crear X
        </Link>
      </Button>
    </div>
    {/* Contenido */}
  </div>
</section>
```

### 8.2 Tabla de listado (patrón completo)

- Envuelta en `<Card>` con `<CardContent className="flex flex-col gap-4 p-0">`.
- Top bar con borde inferior `border-b border-border px-4 py-3` que contiene un search-input con icono `Search` a la izquierda.
- Tabla usa `@tanstack/react-table` (`useReactTable`, `flexRender`, `getCoreRowModel`, `getSortedRowModel`).
- Overlay de loading: `absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]` con `Loader2` animado.
- Estado vacío: componente `Empty` (de shadcn) con icono lucide grande y mensaje en español.
- Footer con paginación: `border-t border-border px-4 py-3`, dos columnas con texto "Mostrando X de Y" + selector de tamaño + nav de páginas.
- IDs únicos en cada `<Table id="...-table">` para estilos/scoping.

### 8.3 Loading

- **Skeleton** (shadcn) para listas (`<Skeleton className="h-4 flex-1" />`).
- **Spinner** `<Loader2 className="h-4 w-4 animate-spin" />` para botones busy y overlays.

### 8.4 Toasts (sileo)

```tsx
import { sileo } from "sileo";

sileo.success({
  title: "Acción completada",
  fill: "",
  styles: {
    title: "text-white! text-[16px]! font-bold!",
    description: "text-white/90! text-[15px]!",
  },
  description: "Mensaje de éxito",
});

sileo.error({
  title: "Error",
  styles: { description: "text-[#dc2626]/90! text-[15px]!" },
  description: "Mensaje de error",
});
```

Posición: `<Toaster position="bottom-right" />` en root layout.

### 8.5 Auth pages (login/register)

- Contenedor: `<div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">`.
- Card centrada: `<Card className="w-full max-w-md">`.
- Logo dentro del header: cuadrado `h-12 w-12 rounded-xl bg-primary text-primary-foreground` con icono lucide.
- Inputs con icono izquierdo (`Mail`, `Lock`) usando wrapper `relative` + clase `pl-9`.
- Toggle de password con `Eye`/`EyeOff` posicionado `absolute right-3 top-1/2 -translate-y-1/2`.
- Botón submit: `<Button className="w-full" disabled={isPending}>`.
- Botón Google: `<Button variant="outline" className="w-full">` con SVG de Google inline.
- Separador "o continua con": dos `<Separator className="flex-1" />` flanqueando un span.
- Mensajes de error: `<p className="text-sm text-destructive" role="alert">`.
- Links: `text-primary hover:underline underline-offset-4`.

---

## 9. Capa de Datos

### 9.1 `src/lib/axios.ts` (copia exacta del patrón)

- Instancia `apiClient` con `baseURL: process.env.NEXT_PUBLIC_API_URL`.
- **Request interceptor**: agrega `Authorization: Bearer <token>` desde `sessionStorage.getItem("token")` (solo en cliente).
- **Response interceptor**: detecta `401`, intenta refresh con `sessionStorage.getItem("refresh_token")` llamando a `/auth/refresh`. Maneja cola de peticiones concurrentes (`failedQueue`). Si falla → limpia storage + cookies → `window.location.href = "/login"`.
- Excluye `/auth/login`, `/auth/refresh`, `/auth/register`, `/auth/activate`, `/auth/send-confirmation-token` del retry.

### 9.2 React Query Provider

```tsx
// src/components/providers/query-provider.tsx
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

const min = 60 * 1000;
const hour = 60 * min;

function makeQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 5 * min,
      },
    },
  });
  // Catálogos estáticos
  qc.setQueryDefaults(["all-plans"], { staleTime: 24 * hour, gcTime: Infinity });
  // Sesión
  qc.setQueryDefaults(["auth-user-data"], { staleTime: 30 * min, gcTime: hour });
  // Transaccional
  qc.setQueryDefaults(["dashboard-summary"], { staleTime: 30 * 1000, gcTime: 5 * min });
  return qc;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => makeQueryClient());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
```

### 9.3 Middleware (auth guard)

`middleware.ts` en root protege `/dashboard/**`. Lee cookie de auth; si falta → redirect `/login`.

---

## 10. Iconografía (`lucide-react`)

- **Tamaño por defecto**: `size-4` (16px). En cards stats: `h-4 w-4`. En badges: `[&>svg]:size-3`.
- **Color por defecto**: hereda `text-muted-foreground` para iconos decorativos; `text-foreground` cuando son protagonistas.
- **Icon-map**: para sidebar dinámico se mantiene `src/lib/icon-map.ts` con `resolveIcon(name: string): LucideIcon`. Mapea strings del backend a componentes (ver `pmanage/src/lib/icon-map.ts`).

Iconos representativos: `Store`, `LayoutDashboard`, `Package`, `ShoppingCart`, `Users`, `Settings`, `Search`, `Plus`, `Loader2`, `Eye`/`EyeOff`, `Mail`, `Lock`, `ChevronRight`, `ArrowUpRight`/`ArrowDownRight`.

---

## 11. Theming (oscuro/claro)

- `next-themes` con `attribute="class"` (clase `.dark` en `<html>`).
- `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`.
- Re-export en `src/components/next-themes.tsx`:
  ```tsx
  "use client"
  export { ThemeProvider, useTheme } from "next-themes"
  ```

---

## 12. Reglas de Estilo / Convenciones

1. **Idioma de UI**: español. Mensajes de error de zod y textos visibles en español.
2. **Clases Tailwind**: usa `cn()` (`@/lib/utils`) siempre que combines clases dinámicas.
3. **No uses colores hex sueltos** — siempre tokens (`text-foreground`, `bg-card`, `border-border`, `text-primary`, `text-destructive`, `text-muted-foreground`).
4. **Bordes**: `border border-border` (o solo `border` cuando sea suficiente, ya que `*` aplica `border-color: hsl(var(--border))`).
5. **Tarjetas**: por defecto `rounded-xl` (12px). Botones `rounded-md` (6px). Pills/badges `rounded-full`.
6. **Sombras**: `shadow-sm` (cards), `shadow-xs` (inputs/buttons outline).
7. **Spacing**: header de página `gap-8`, secciones `gap-6`, contenido de cards `gap-4`. Padding interno cards `px-6 py-6`.
8. **Tipografía jerárquica**:
   - H1 de página: `text-2xl font-bold tracking-tight text-foreground`
   - Subtítulo: `text-muted-foreground`
   - Card title: `font-semibold`
   - Texto secundario / labels suaves: `text-xs text-muted-foreground`
9. **Botones de acción primaria**: `<Button asChild><Link href="..."><Plus /> Texto</Link></Button>` con `default` (que en este proyecto es **negro/foreground**, no verde). El verde **primary** se usa para links, badges Pro, iconos clave, y en componentes específicos donde se aplica explícitamente `bg-primary`.
10. **Empty states**: usar componente `Empty` con icono lucide y mensaje en español.
11. **Estados busy**: `aria-busy`, `disabled`, ícono `Loader2 animate-spin`.

---

## 13. Checklist de Inicio para `psearch`

```bash
# 1. Crear proyecto (si no existe)
pnpm create next-app@latest psearch --typescript --app --eslint --src-dir --import-alias "@/*"
cd psearch

# 2. Dependencias core (versiones del pmanage)
pnpm add @base-ui/react @hookform/resolvers @radix-ui/react-dialog @radix-ui/react-slot \
  @tanstack/react-query @tanstack/react-table axios class-variance-authority clsx cmdk \
  date-fns lucide-react next-themes radix-ui react-hook-form sileo \
  tailwind-merge zod zustand

# 3. Dev deps
pnpm add -D @tailwindcss/postcss tailwindcss tw-animate-css babel-plugin-react-compiler

# 4. Tailwind v4 (PostCSS)
# Reemplaza postcss.config.mjs con el snippet de la sección 3.3

# 5. globals.css → copia íntegro de la sección 3.1

# 6. components.json → sección 3.2
# Luego: npx shadcn@latest add button card input label dialog dropdown-menu select \
#        table tabs tooltip popover sheet sidebar skeleton separator badge checkbox \
#        textarea avatar collapsible

# 7. Crear src/lib/utils.ts, src/lib/axios.ts (con tu API base), src/lib/routes/index.ts

# 8. Crear layout root (sección 3.6) + providers (QueryProvider + ThemeProvider)

# 9. Crear src/app/dashboard/layout.tsx + src/components/sidebar/sidebar.tsx
```

### Variables de entorno

`.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api/v1
```

---

## 14. Resumen para el Agente Receptor

> **Instrucción para el agente que recibe esto:**
>
> "Aplica el sistema de diseño descrito. Pasos en orden:
> 1. Instala el stack del paso 13.
> 2. Reemplaza `globals.css`, `components.json`, `postcss.config.mjs`, `tsconfig.json` (paths), `src/lib/utils.ts` y `src/app/layout.tsx` con los snippets de la sección 3.
> 3. Crea la estructura de carpetas de la sección 4.
> 4. Instala los primitivos shadcn listados (sección 13, paso 6) — usarán automáticamente los tokens CSS del paso 2.
> 5. Implementa `apiClient` con interceptores (sección 9.1) y `QueryProvider` (sección 9.2).
> 6. Construye el `dashboard/layout.tsx` y `AppSidebar` siguiendo la sección 6 (copia `sidebar.tsx` shadcn tal cual).
> 7. Para cada feature de psearch, sigue **exactamente** el patrón de 5 archivos de la sección 5.
> 8. Aplica patrones UI de la sección 8 (header de página, tablas con Card + overlay loading, auth pages, toasts sileo).
> 9. Respeta las convenciones de la sección 12 — tokens, no hex sueltos, mensajes en español, `cn()` para clases.
>
> No inventes nuevos colores ni rompas los tokens. Si dudas, replica el componente equivalente de pmanage."

---

**Fin de la guía.** Cualquier componente específico que necesites más detalle, abre el archivo equivalente en `pmanage/src/components/ui/<nombre>.tsx` o `pmanage/src/app/dashboard/<feature>/page.tsx` y cópialo como referencia base.
