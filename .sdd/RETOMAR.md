# Dónde quedamos

**Última actualización:** 2026-11-20, 22:00
**Rama de trabajo:** `mauricio_dev` — `main` no se toca
**Siguiente acción:** rediseño UX/UI (moderno, minimalista, fresco) **antes** de promover. Después, plan de promoción (A7) sobre `web-platform-g1` — paso destructivo, requiere aprobación de Mauricio

Este archivo se actualiza al dejar el proyecto, no al empezar.

> **Al retomar, revisar la rama primero.** GitHub Desktop abre el repo en la
> última rama seleccionada y el 2026-11-20 el checkout apareció en `main`, que
> no tiene nada del trabajo nuevo (ni baseline, ni `config.toml`, ni scripts).

## A5 — verificación contra Supabase local

| Caso | Resultado | En producción |
|---|---|---|
| Alta de adulto | ✔ guardada (`POST 201`) | — |
| Tipo de ficha `nueva` | ✔ | ✗ rechazado por constraint |
| Rama en texto libre (`Clan Rover`) | ✔ | ✗ rechazado por constraint |
| Trasladar a `Hospital de Diagnostico` | ✔ | ✗ rechazado por constraint |
| Firma dibujada (dirigente) | ✔ | ✔ |
| Edición de la ficha desde el panel | ✔ carga | — |
| **Aprobar** desde el panel admin | ✔ `approved` | ✗ `approved` no existe en el constraint |
| `audit_log` | ✔ INSERT y UPDATE `submitted → approved` | ✗ vacío desde siempre |
| Estado civil `union_libre` desde la app | ✔ | ✗ |
| Alta de beneficiario (`caminantes_15_17`, dos tutores, dos firmas) | ✔ | — |
| Textareas guardados con espacios y una entrada por línea | ✔ `["Linea 1", "Linea 2"]` | ✗ |

**A1–A6 cumplidos.** Pendiente en spec 003: comprobar que un usuario normal que entra a `/admin` sea redirigido (las fichas del 20-nov se llenaron con la cuenta admin).

## Corregido el 2026-11-20

- **Campos "uno por línea" de la ficha de adulto** (Grupo familiar y los tres
  de Trayectoria Scout) no aceptaban espacios ni Enter: el textarea se pintaba
  desde el array ya limpio y cada `trim()`/`filter()` borraba lo que se
  tipeaba. Commit `d6548ff`, verificado tecleando con Playwright.
  Evidencia del daño: un intento previo guardó
  `"IMProgramaDeJovenesRamaRover2017"`, con los espacios comidos.

## Hallazgos abiertos

- **La auditoría no registra qué admin aprobó.** La fila `submitted → approved`
  queda con `admin_id` NULL ("sistema") porque el route handler escribe con
  `service_role`. C6 pide trazabilidad administrativa: el registro existe pero
  no dice quién. Candidato a spec.
- Candidatos a spec 004: indicador visible de a qué base está conectada la app;
  `UNIQUE(dui)` global que impide reinscribirse al año siguiente
  (`[PENDIENTE-1]` del baseline); fechas `timestamp` sin zona horaria.

## Entorno local

- `npx supabase start` (Docker Desktop abierto) · `npm run dev`
- `npm run db:reset` resetea y recrea usuarios:
  `e2e.formularios@gruposcout1.test` / `E2eTest123!` (user) ·
  `e2e.admin@gruposcout1.test` / `E2eAdmin123!` (admin)
- `.env.local` → local · `.env.production.local` → producción
- Claude opera Docker, Supabase, npm, git y Playwright vía Desktop Commander.
  Push solo cuando Mauricio lo pide.

## Pendiente para promover (A7)

**Q2 resuelta:** sobre `web-platform-g1`. La ficha de prueba de producción se
puede borrar (Q1). Ojo: el baseline usa `create table if not exists`, así que
aplicado sobre las tablas existentes no corregiría nada; hay que partir de una
base limpia. Plan a presentar antes de ejecutar.

---

## Histórico

## Lo cerrado el 2026-11-07

### Niebla de git: resuelta
`.gitattributes` con `* text=auto eol=lf` y `core.autocrlf=false`. Los 36 archivos
que aparecían modificados sin un solo cambio real de contenido (CRLF vs LF por
Windows + OneDrive) desaparecieron. `git status` vuelve a decir la verdad.

También se quitó un `.git/rebase-merge/` **vacío**, fantasma del `pull --rebase`
del 4 de octubre que sí había terminado bien. Git no pudo borrar su propio
directorio porque OneDrive se lo impedía, y eso hacía fallar **cualquier** comando
git con *"cannot switch branch while rebasing"*.

### Spec 001 (A2): respondida, y el resultado define la 002

**Producción y `supabase/migrations/` son dos sistemas distintos.**

| Objeto | Migraciones `0001`->`0005` | Producción |
|---|---|---|
| `adult_forms` | 41 columnas | **74** |
| `beneficiary_forms` | ~40 columnas | **110** |
| `inscriptions` | sin `updated_at` | con `updated_at` |
| `user_roles` | sin `updated_at` | con `updated_at` |
| `audit_log` | `inscription_id`, `created_at` | `record_type`, `record_id`, `timestamp`; sin `inscription_id` |
| Trigger auditoría | `trg_inscriptions_audit` -> `log_inscription_change()` | `inscriptions_audit` -> `audit_inscription_changes()` |
| Trigger timestamp | no existe | `update_inscriptions_timestamp` -> `update_timestamp()` |

Aplicar las migraciones desde cero **falla**: la `0002` referencia
`inscriptions.updated_at`, que la `0001` nunca crea. Q2 quedó contestada por las
propias migraciones — sus encabezados dicen "Aplica en Supabase Dashboard > SQL
Editor", y la `0004` describe "la base viva" con constraints sobre columnas que la
`0001` no declara. El schema se construyó en el editor; las migraciones son notas.

### Resueltos por el historial de git, sin trabajo pendiente

| Hallazgo | Resolución |
|---|---|
| A2 código — ¿`aprobar/rechazar` completo? | Implementado en `70430d3` |
| B3 — ¿export Excel/PDF real o disfrazado? | Real, en `70430d3` |
| C2 — ¿`.env.local` versionado? | No. Cubierto por `.gitignore:41` (`.env*`) |

## La ventana que hay que aprovechar

```
inscriptions:       1 fila  (adulto, submitted, 2026, creada 04-oct)
adult_forms:        1 fila
beneficiary_forms:  0 filas   <- cero datos de menores
user_roles:         1 fila
```

Reconstruir el schema hoy cuesta casi nada. En marzo, con 80-95 fichas y datos
reales de menores, sería una migración delicada (C4). **Esa es la razón de que la
spec 002 sea la prioridad.**

## Defectos activos en producción que el baseline debe corregir

No heredar — están en la sección 6 de la spec 002:

1. **`user_roles` tiene RLS activo y ninguna política.** Nadie lee su propio rol
   salvo vía `service_role`. La `0001` sí la declaraba: más prueba de que no fue lo
   aplicado. Viola C2 y C3.
2. **`audit_inscription_changes()` y `update_timestamp()` con `search_path`
   mutable**, siendo `SECURITY DEFINER`.
3. **`audit_log` vacío** con una inscripción `submitted` registrada. O la fila
   precede al trigger, o la auditoría no funciona. C6 depende de esto (es la Q3 de
   la 002, verificable).
4. Protección de contraseñas filtradas desactivada en Supabase Auth.

## Decisión vigente sobre entornos

**Decisión 0003: Supabase local en Docker**, como banco de trabajo para construir
el baseline y como entorno de pruebas permanente. Supersede la 0002; el segundo
proyecto Supabase se descarta y el slot libre del free tier queda disponible.

Hubo tres decisiones sobre lo mismo y el motivo está en la 0003: el problema nunca
cambió, cambió la información disponible.

**Disciplina no negociable desde acá:** todo cambio de schema pasa por una
migración, nunca por el editor SQL. Es la regla cuya ausencia causó este problema.

## Pendiente para mañana

### Reparto del trabajo (spec 002, fase de plan)

| Paso | Quién |
|---|---|
| Extraer schema completo de producción (74 + 110 columnas, constraints, índices, triggers, RLS) | Claude, vía MCP de Supabase |
| Escribir `0000_baseline.sql` con los defectos de arriba corregidos | Claude |
| `supabase init` · `supabase start` · `db reset` | Mauricio — requiere Docker Desktop |
| Verificar equivalencia y correr la app contra local | Los dos |

### Preguntas que bloquean la promoción (A7), no la construcción

Se puede avanzar hasta A6 sin resolverlas.

| # | Pregunta | Decide |
|---|---|---|
| Q1 | La única ficha de producción: ¿se preserva, se migra, o se descarta como dato de prueba? | Mauricio |
| Q2 | ¿Se reconstruye sobre `web-platform-g1` o sobre un proyecto nuevo que luego se promueve? | Mauricio |
| Q3 | ¿El trigger de auditoría falla, o la fila lo precede? | Claude (verificable) |

## Después de la 002

- **003 — cerrar la brecha de cobertura E2E**, ahora contra local. `AGENTS.md`
  sección 8 declara cobertura de proxy, login/signup, Mis Inscripciones y todo el
  panel admin; en el repo hay dos specs, ambas de formularios de usuario.
- **004 — limpieza estructural:** `next-auth` sin usar, `shadcn-ui` como
  dependencia de runtime, imagen de fondo fuera de `public/`, `components/` vacío
  en la raíz.
- Pendiente de la 001: sincronizar `AGENTS.md` secciones 3, 6, 8 y 9 con la
  realidad.

## Reparto de herramientas

- **Claude Code (en la máquina):** ciclo de construcción — editar, `npm run dev`,
  Playwright, iterar, commits. Lee `CLAUDE.md` y `.sdd/` solo.
- **Claude en claude.ai (este Proyecto):** specs, decisiones, auditorías de schema
  por MCP de Supabase, revisión de despliegues por MCP de Vercel.
- **Push a GitHub:** lo hace Mauricio. El shell de Claude en la máquina corre en un
  entorno Linux aislado que no alcanza el administrador de credenciales de Windows.
