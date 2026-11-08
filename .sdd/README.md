# Flujo SDD — Sistema de Inscripciones G1

Spec-Driven Development: **nada se implementa sin una spec aprobada**.
Este directorio es la fuente de verdad del *qué* y el *por qué*; el código es
la consecuencia.

## Jerarquía de documentos

| Archivo | Responde | Lo escribe | Inmutable tras aprobar |
|---|---|---|---|
| `00-constitution.md` | ¿Qué reglas nunca se rompen? | Mauricio | Sí (cambio = decisión explícita) |
| `baseline/inventario.md` | ¿Qué existe hoy, verificado? | Claude, por auditoría | No (se refresca por auditoría) |
| `baseline/deuda-tecnica.md` | ¿Qué está mal o desincronizado? | Claude, por auditoría | No |
| `specs/NNN-slug/spec.md` | QUÉ y POR QUÉ | Mauricio + Claude | Sí |
| `specs/NNN-slug/plan.md` | CÓMO (arquitectura) | Claude, revisa Mauricio | No |
| `specs/NNN-slug/tasks.md` | Checklist ejecutable | Claude | No |
| `decisiones/NNNN-slug.md` | ¿Por qué se eligió esto y no la alternativa? | Mauricio + Claude | Sí (se supersede, no se edita) |

## Ciclo de trabajo

```
1. SPEC     Se escribe spec.md. Sin código. Sin nombres de archivo.
            ↓ Mauricio aprueba (marca `estado: aprobada`)
2. PLAN     Claude escribe plan.md: archivos a tocar, migraciones,
            contratos de API, impacto en RLS, riesgos.
            ↓ Mauricio revisa
3. TASKS    Claude desglosa en tasks.md, tareas atómicas y verificables.
            ↓
4. BUILD    Se implementa tarea por tarea. Cada tarea cierra con su
            criterio de aceptación verificado.
            ↓
5. VERIFY   Specs E2E que cubren los criterios de aceptación de la spec.
            ↓
6. SYNC     Se actualizan AGENTS.md y baseline/inventario.md.
```

**Regla dura:** si durante BUILD aparece algo que la spec no contempla, se
detiene y se enmienda la spec. No se improvisa en el código.

## Convención de numeración

`specs/NNN-slug/` — `NNN` es correlativo de tres dígitos, nunca se reutiliza.
El slug es kebab-case en español, corto: `003-aprobar-rechazar`.

## Estados de una spec

| Estado | Significado |
|---|---|
| `borrador` | En redacción, no implementable |
| `aprobada` | Lista para plan + build |
| `en-curso` | Hay tareas en ejecución |
| `cerrada` | Implementada y verificada |
| `descartada` | No se hará; se conserva el registro y el motivo |

## Registros de decisión

Cuando una spec o un plan elige entre alternativas con trade-offs reales, el
razonamiento va a `decisiones/NNNN-slug.md`, no enterrado en el plan. Ver
`decisiones/README.md`. La spec dice *qué* se hace; la decisión dice *por qué
no se hizo lo otro*.

## Relación con AGENTS.md

`AGENTS.md` describe el estado **actual** del sistema (contexto permanente
para el agente). `.sdd/` describe el **cambio** que se quiere hacer.
Al cerrar una spec, AGENTS.md se actualiza — es el paso 6, no es opcional.
