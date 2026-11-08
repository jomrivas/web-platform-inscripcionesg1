# Deuda técnica y hallazgos

Auditoría 2026-11-01. Severidad: **A** bloquea o engaña · **B** corregir pronto ·
**C** limpieza.

---

## A1 — La documentación de cobertura E2E sobredeclara

`AGENTS.md` §8 afirma cobertura de proxy, login/signup, Mis Inscripciones y
panel admin (KPIs, filtros, búsqueda, exportación). En el repo solo existen
dos specs, ambas de formularios de usuario.

**Por qué importa:** es el peor tipo de deuda — un agente (o tú en tres meses)
asume red de seguridad donde no hay ninguna, y despliega durante la ventana de
marzo-abril confiando en una suite que no cubre el panel admin.

**Acción:** corregir §8 a la cobertura real y abrir spec para cerrar la brecha.

---

## A2 — Tres módulos implementados y documentados como pendientes

Existen en el código pero `AGENTS.md` §9 los lista como no implementados:

- `app/admin/inscripciones/[id]/page.tsx` — detalle de inscripción
- `app/api/inscriptions/[id]/route.ts` — presumiblemente PATCH de estado
- `src/components/EditorInscripcion.tsx` — edición
- migración `0002_approved_status.sql` — el estado `approved` no aparece en §3

**Por qué importa:** si están a medias, nadie sabe en qué punto quedaron. Si
están completos, el backlog está inflado y se puede trabajar en otra cosa.

**Acción:** leer esos cuatro artefactos y decidir *completo* / *a medias* /
*abandonado* antes de planificar nada más.

---

## A3 — `components/` en la raíz está vacío y `AGENTS.md` lo documenta como real

§6 del documento dibuja `components/SignaturePad.tsx` etc. en la raíz. Los
componentes viven en `src/components/`. El directorio raíz existe vacío.

**Por qué importa:** un agente que siga §6 creará componentes en la ruta
equivocada y producirá imports roto o duplicación silenciosa.

**Acción:** borrar `components/` y corregir §6.

---

## B1 — `next-auth@4` instalado junto a Supabase Auth

El proyecto autentica con `@supabase/ssr`. `next-auth` no aparece en ninguna
ruta del árbol auditado.

**Acción:** confirmar que no se importa y desinstalar. Dos sistemas de auth en
`package.json` es una trampa para quien lea el proyecto después.

---

## B2 — `shadcn-ui` como dependencia de runtime

`shadcn-ui@0.9.5` está en `dependencies`. Es un CLI de scaffolding, no una
librería de runtime; además no se observan componentes shadcn en el árbol.

**Acción:** mover a `devDependencies` o desinstalar según si se usa el CLI.

---

## B3 — `exceljs` y `pdf-lib` instalados, exportación documentada como falsa

§9 dice que el Excel es "CSV con Content-Type de Excel" y el PDF es "HTML
imprimible", pero ambas librerías reales están instaladas.

**Acción:** leer `app/api/export/route.ts`. Si ya usa las librerías, §9 está
obsoleta; si no, hay dependencias de 2+ MB sin usar.

---

## B4 — Imagen de fondo en `src/` en vez de `public/`

`src/bg_login_wpg1.jpeg` (151 KB) está fuera de `public/`, así que no se sirve
como estático ni pasa por optimización de imágenes.

**Acción:** mover a `public/` y servirla con `next/image`, o importarla como
módulo si se quiere el hash de build.

---

## B5 — Migraciones 0004 y 0005 son correcciones de constraints

`0004_fix_adult_form_constraints.sql` y `0005_fix_beneficiary_form_constraints.sql`
indican que el schema inicial tenía constraints incorrectos. No hay registro de
qué estaba mal ni por qué.

**Acción:** documentar en `AGENTS.md` §3 el estado final de los constraints, para
no reintroducir el error.

---

## C1 — Bloque `nextjs-agent-rules` duplicado en AGENTS.md

El aviso de Next.js aparece dos veces: una suelta (líneas ~328-333) y otra entre
los marcadores `BEGIN/END:nextjs-agent-rules`. `next dev` regenera el bloque
marcado; la copia suelta es basura que no se va a limpiar sola.

**Acción:** borrar la copia sin marcadores.

---

## C2 — Verificar que `.env.local` no esté versionado

`.env.local` (1054 bytes) está en el directorio. `.gitignore` existe (628 bytes)
pero no se ha verificado su contenido.

**Acción:** `git check-ignore -v .env.local`. Si está versionado, rotar las claves
de Supabase y Resend, no solo borrarlo del índice.

---

## C3 — `AGENTS.md` mezcla dos documentos

El archivo es a la vez skill (frontmatter `name`/`description`/`version`) y
documento de contexto, más el bloque inyectado por `next dev`. Funciona, pero el
frontmatter de skill en un `AGENTS.md` raíz es una convención poco común.

**Acción:** ninguna urgente. Si se separa, el contexto de producto va a
`AGENTS.md` y la skill a `.agents/skills/`.

---

## Orden sugerido

1. **A2** — saber qué está realmente hecho (sin esto, todo lo demás se planifica a ciegas)
2. **C2** — seguridad de credenciales, es un comando
3. **A3 + B1 + B2 + B4** — limpieza mecánica, una sola spec
4. **A1** — cerrar la brecha de cobertura E2E
5. **B3 + B5 + C1** — sincronización de documentación
