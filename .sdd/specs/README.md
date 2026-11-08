# Specs

Una carpeta por spec: `NNN-slug/` con `spec.md`, `plan.md` y `tasks.md`.
Copiar desde `../templates/`.

## Registro

| ID | Título | Estado | Prioridad | Depende de |
|---|---|---|---|---|
| 001 | Reconciliar el estado real del sistema con su documentación | borrador | alta | — |
| 002 | Entorno de desarrollo local con Supabase CLI | borrador | alta | 001 |
| 003 | Cerrar la brecha de cobertura E2E | borrador | alta | 002 |
| 004 | Limpieza estructural y de dependencias | borrador | media | 001 |

## Orden y por qué

**001 primero** porque todo lo demás depende de saber qué está realmente
implementado y si el schema de producción es reproducible desde las migraciones.

**002 depende de 001** por el criterio A2: un entorno local reconstruido desde
las migraciones solo es fiel si producción coincide con ellas. Ver
`../decisiones/0001-entorno-local-supabase.md`.

**003 depende de 002** porque escribir pruebas nuevas contra producción
agravaría el problema que 002 resuelve: hoy cada corrida escribe fichas
ficticias de beneficiarios junto a datos reales y consume cuota de Resend.

**004 depende de 001** únicamente para no borrar algo que resulte estar en uso.

Las cuatro salen de `../baseline/deuda-tecnica.md`.
