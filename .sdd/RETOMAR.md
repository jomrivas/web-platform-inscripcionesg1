# Dónde quedamos

**Última actualización:** 2026-11-07
**Estado del proyecto:** pausado por elección — prioridad en el Calendario del
Clan Maya. Se retoma después.

Este archivo existe para que retomar no cueste una sesión de reorientación.
Se actualiza al dejar el proyecto, no al empezar.

---

## El proyecto está sano

Conclusión de la revisión del 2026-11-07, contra evidencia y no contra la
documentación:

- **El repo está limpio.** `git status` reporta 38 archivos modificados, pero
  `git diff --ignore-cr-at-eol` muestra solo 2 con cambios reales. Los otros 36
  son finales de línea CRLF vs LF (Windows + OneDrive, sin `.gitattributes` y con
  `core.autocrlf` sin definir). Las 4 migraciones "modificadas" tienen cero
  líneas de SQL distintas.
- **Hay más implementado de lo que decía `AGENTS.md`.** El commit `70430d3`
  ("Seguridad API, validación Zod, firma obligatoria+táctil, exports reales,
  aceptar/rechazar admin") entregó cosas que §9 seguía listando como pendientes.
- **No se justifica reescribir de cero.** Hay cinco migraciones ordenadas,
  validación Zod server-side, RLS, auditoría, exports reales, aprobar/rechazar
  y una suite E2E con Page Objects.

Lo que estaba desactualizado era la documentación, no el código.

## Hallazgos de auditoría ya resueltos

Respondidos por el historial de git, no requieren trabajo:

| Hallazgo | Resolución |
|---|---|
| A2 — ¿`aprobar/rechazar` está completo? | Implementado en `70430d3` |
| B3 — ¿el export Excel/PDF es real o disfrazado? | Real, en `70430d3` |
| C2 — ¿`.env.local` está versionado? | No. Cubierto por `.gitignore:41` (`.env*`) |

## Decisión vigente sobre el entorno de pruebas

**Opción A: segundo proyecto Supabase del free tier, dedicado a pruebas.**
Nada local, nada de Docker. Ver `decisiones/0002-entorno-de-pruebas-segundo-proyecto.md`,
que supersede a la 0001.

Motivo de fondo que no hay que perder de vista: hoy la suite E2E escribe fichas
ficticias de beneficiarios en las mismas tablas que los datos reales de los
chicos, y consume cuota de Resend de producción.

## Próximos pasos, en orden

### 1. Matar la niebla de git — mecánico, ~5 minutos

No requiere spec: no cambia comportamiento.

- Crear `.gitattributes` con `* text=auto eol=lf`
- Normalizar el árbol y commitear
- Commitear los dos cambios reales (`AGENTS.md`, `CLAUDE.md`) y el directorio
  `.sdd/`, que sigue sin versionar

Resultado: `git status` vuelve a decir la verdad.

### 2. Spec 001 — reconciliación

Ya está redactada en `specs/001-reconciliacion/spec.md`, en estado `borrador`.
Está casi contestada: lo que queda es
**A2, el diff entre el schema de producción y las migraciones `0001`→`0005`**.

Antes de aprobarla, actualizar su alcance: A2, B3 y C2 ya están resueltos (ver
arriba), así que el alcance real se reduce a la verificación de schema y a
sincronizar `AGENTS.md`.

Pregunta abierta que solo puede contestar Mauricio (Q2 de la spec):
**¿las migraciones `0004` y `0005` se aplicaron por CLI o pegando el SQL en el
editor de Supabase?** Si fue por el editor, ya sabemos que hay deriva.

### 3. Spec 002 — montar el proyecto de pruebas

Bloqueada por A2 de la 001. No tiene sentido montar un entorno fiel antes de
saber a qué debe ser fiel.

### 4. Spec 003 — cerrar la brecha de cobertura E2E

`AGENTS.md` §8 declara cobertura de proxy, login/signup, Mis Inscripciones y
todo el panel admin. En el repo hay dos specs, ambas de formularios de usuario.
Bloqueada por la 002, porque escribir pruebas nuevas contra producción agravaría
el problema que la 002 resuelve.

## Reparto de herramientas

- **Claude Code (en la máquina):** el ciclo de construcción — editar archivos,
  `npm run dev`, correr Playwright, iterar sobre errores, commits y PRs. Lee
  `CLAUDE.md` y `.sdd/` automáticamente.
- **Claude en claude.ai (este Proyecto):** especificaciones, decisiones,
  auditorías de schema vía MCP de Supabase, revisión de despliegues vía MCP de
  Vercel, y el razonamiento previo a escribir código.
