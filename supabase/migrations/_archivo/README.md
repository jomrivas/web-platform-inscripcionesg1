# Migraciones archivadas (0001–0005)

**Archivadas el 2026-11-11 por la spec 002.** No las apliques: no se ejecutan ni
describen el sistema. Se conservan como registro de cómo se llegó acá (R4).

## Por qué se archivaron

No reproducen la base. Aplicadas desde cero, **fallan**: la `0002` crea una
vista que referencia `inscriptions.updated_at`, columna que la `0001` nunca
crea.

Y describen un sistema que no existe. Comparado con el schema real extraído de
producción el 2026-11-11:

| Objeto | Las migraciones decían | Producción tenía |
|---|---|---|
| `adult_forms` | 41 columnas | 74 |
| `beneficiary_forms` | ~40 columnas | 110 |
| `audit_log` | `inscription_id`, `created_at` | `record_type`, `record_id`, `timestamp` |
| Trigger auditoría | `trg_inscriptions_audit` → `log_inscription_change()` | `inscriptions_audit` → `audit_inscription_changes()` |

## El hallazgo que justifica archivarlas

**Las migraciones `0002`, `0004` y `0005` nunca se aplicaron a producción.** No
es que se aplicaran distinto: no se aplicaron. Los constraints que decían
corregir seguían intactos y con otros valores:

| Constraint | La migración decía dejarlo en | Producción tenía |
|---|---|---|
| `inscriptions.status` | + `approved` (0002) | solo `draft, submitted, rejected` |
| `adult_forms.tipo_ficha` | `nueva, reingreso, actualizacion, renovacion` (0004) | `reubicacion, renovacion, aspirante` |
| `adult_forms.estado_civil` | + `union_libre` (0004) | sin `union_libre` |
| `adult_forms.rama` | eliminado (0004) | `manada, scout, comunidad, clan` |
| `adult_forms.emergencia_trasladar_a` | eliminado (0004) | `privado, publico, isss` |
| `beneficiary_forms.emergencia_trasladar_a` | eliminado (0005) | `privado, publico, isss` |

Es decir: **los errores que la `0004` y la `0005` describían seguían vivos en
producción**, y la `0002` dejó al panel de administración usando un estado
(`approved`) que la base rechazaba.

Solo la `0003` dejó rastro verificable: las columnas `responsable_rama` y
`asistente_rama` sí existen.

## Causa raíz

Los encabezados de `0002` a `0005` dicen *"Aplica en Supabase Dashboard > SQL
Editor"*. El schema se construyó en el editor; estos archivos quedaron como
notas de intención, no como receta ejecutada. Algunas de esas intenciones nunca
se ejecutaron.

De ahí la regla **R5** de la spec 002, que ahora vive en la constitución del
proyecto: **todo cambio de schema pasa por una migración, nunca por el editor
SQL.**

## Reemplazo

`supabase/migrations/0000_baseline.sql`, extraído del schema real de producción
y validado contra un Postgres limpio: se aplica desde cero sin error, es
reaplicable, y reproduce los conteos de columnas exactos (74 / 110 / 9 / 5 / 8).
Cada desviación respecto de producción está marcada `[FIX-n]` y justificada.
