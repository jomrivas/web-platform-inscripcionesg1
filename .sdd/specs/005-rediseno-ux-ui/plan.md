# 005 — Plan

Spec: `spec.md` (aprobada 2026-11-22, enmendada 2026-11-24). Este plan cubre
las tres etapas de Q1; el detalle de tareas va en `tasks.md`.

## Etapa 1 — Base visual (sin cambios de páginas)

| Archivo | Cambio |
|---|---|
| `app/globals.css` | Tokens en `@theme` de Tailwind 4: color, radios, sombras y fuente. Foco visible global. Se eliminan los hex sueltos de los controles |
| `app/layout.tsx` | Nunito con `next/font/google` (`variable: --font-nunito`), autoalojada en el build |
| `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` | Generados desde `public/brand/PNG/isotipo.png` (convención de archivos de metadata de Next) |
| `lib/ramas.ts` | Etiquetas visibles de rama (R5) y su tono. Los valores guardados no cambian |
| `src/components/ui/*` | Componentes base (ver abajo) |

**Componentes base** (`src/components/ui/`), sin lógica de datos y sin
imponer `name`: el formulario que los usa sigue pasando sus props (C8).

| Componente | Notas |
|---|---|
| `Button`, `ButtonLink` | primario, secundario, peligro, fantasma; alto mínimo 48 px (R4) |
| `Field` + `Input`, `Select`, `Textarea` | `label` con `htmlFor`/`id`, ayuda y error con `aria-describedby`; `aria-invalid` pinta el borde de error (A8) |
| `StatusChip` | `draft`, `submitted`, `approved`, `rejected` → Borrador, En revisión, Aprobada, Rechazada; punto + texto (E6) |
| `RamaChip` | punto de color + tinte; el color nunca va solo (E6) |
| `Stepper` | lista ordenada con `aria-current="step"` y texto "Paso X de N" |
| `Card` | superficie blanca, radio y sombra de token |
| `BottomNav` | navegación inferior móvil, `aria-current="page"` |
| `AdminSidebar` | barra lateral; en teléfono se apila arriba (E5) |
| `BrandLogo` | `next/image` sobre los SVG de `public/brand/` |

**Impacto:** ninguna página cambia de estructura. Lo único visible es la
fuente, el foco y el favicon. Sin cambios de schema, API, RLS ni `name`.

**Verificación:** `tsc --noEmit`, `npm run lint`, `next build` y la suite E2E
actual contra Supabase local, sin tocar pruebas.

## Etapa 2 — Portada y flujo de familias

Portada, ingreso, registro, inicio, elegir tipo, mis inscripciones y ambas
fichas por pasos (§6), con los textos fijos de §13. Incluye E7/R9: regla del
correo por tutor en `lib/validators.ts` y ajuste de datos de prueba y POM (A7,
A13). Se detalla al cerrar la etapa 1.

## Etapa 3 — Panel admin

Layout con `AdminSidebar`, listados con filtros y revisión por secciones. Se
detalla al cerrar la etapa 2.

## Riesgos

- **`next/font/google` descarga la fuente en el build.** Sin red durante el
  build, falla. En Vercel y en local con internet no es problema; si llegara a
  serlo, se cambia a `next/font/local` con los archivos en el repo.
- **Fichas a pasos (etapa 2):** las pruebas abren pestañas por nombre en el
  POM. Al pasar a pasos se ajusta solo el método interno del POM, no los
  selectores de campo (A7).
