@AGENTS.md
@.sdd/README.md
@.sdd/00-constitution.md

# Reglas de trabajo con Claude Code en este repo

Este proyecto sigue **SDD (Spec-Driven Development)**. El flujo está en
`.sdd/README.md` y las reglas inviolables en `.sdd/00-constitution.md`.

## Antes de escribir código

1. Verificar que existe una spec en `.sdd/specs/NNN-slug/spec.md` con
   `estado: aprobada`. Si no existe, escribir la spec primero y esperar
   aprobación — no implementar.
2. Leer `.sdd/baseline/inventario.md` antes de asumir qué está implementado.
   `AGENTS.md` describe el estado deseado del producto; el inventario describe
   lo que hay verificado en el árbol.
3. Para código de framework, consultar `node_modules/next/dist/docs/`. Este
   repo corre Next 16 + React 19 y las APIs difieren del conocimiento
   preentrenado.

## Durante la implementación

- Si aparece algo que la spec no contempla: detenerse, decirlo, enmendar la
  spec. No improvisar en el código.
- Componentes en `src/components/`, nunca en `components/` (raíz, vacío).
- Validaciones en `lib/validators.ts` (servidor). Una validación solo en
  cliente se considera ausente.
- Toda tabla nueva lleva RLS. Toda vista se crea con `SECURITY INVOKER`.
- Acciones administrativas que cambian estado se registran en `audit_log`.

## Al cerrar

Una spec no está cerrada hasta que `AGENTS.md` y
`.sdd/baseline/inventario.md` reflejan el nuevo estado.

## Idioma

Documentación, specs, commits y comentarios en español. Identificadores de
código en el idioma que ya usa el archivo que se está tocando.
