# Specs

Una carpeta por spec: `NNN-slug/` con `spec.md`, `plan.md` y `tasks.md`.
Copiar desde `../templates/`.

## Registro

| ID | Título | Estado | Prioridad | Depende de |
|---|---|---|---|---|
| 001 | Reconciliar el estado real del sistema con su documentación | borrador | alta | — |
| 002 | Reconstruir el schema desde un baseline limpio y verificable | **aprobada** | alta | 001 |
| 003 | Cerrar la brecha de cobertura E2E | borrador | alta | 002 |
| 004 | Limpieza estructural y de dependencias | borrador | media | 001 |

## Orden y por qué

**001 ya está respondida en lo esencial.** La auditoría encontró que producción y
`supabase/migrations/` son dos sistemas distintos (74 vs 41 columnas en
`adult_forms`, 110 vs ~40 en `beneficiary_forms`, triggers con otro nombre y otra
función). A2 cerrado: hay deriva, y es severa. Queda sincronizar `AGENTS.md`.

**002 es ahora la pieza central.** Reconstruye el schema desde un baseline
verificable, aprovechando que producción tiene cero fichas de beneficiarios. Esa
ventana se cierra en marzo. Ver `../decisiones/0003-supabase-local-docker.md`.

**003 depende de 002** porque las pruebas nuevas corren contra el local que la 002
levanta, no contra producción.

**004 depende de 001** únicamente para no borrar algo que resulte estar en uso.

Las cuatro salen de `../baseline/deuda-tecnica.md`.
