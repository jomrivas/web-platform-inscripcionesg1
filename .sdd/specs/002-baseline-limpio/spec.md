---
id: 002
slug: baseline-limpio
titulo: Reconstruir el schema desde un baseline limpio y verificable
estado: aprobada
prioridad: alta
creada: 2026-11-07
aprobada: 2026-11-07
constitucion: [C1, C2, C3, C5, C6, C10, C11]
depende: [001]
bloquea: [003]
---

# 002 — Reconstruir el schema desde un baseline limpio y verificable

## 1. Problema

`supabase/migrations/` y la base de producción son dos sistemas distintos. La
auditoría de la spec 001 lo midió:

| Objeto | Migraciones `0001`→`0005` | Producción |
|---|---|---|
| `adult_forms` | 41 columnas | **74** |
| `beneficiary_forms` | ~40 columnas | **110** |
| `inscriptions` | sin `updated_at` | con `updated_at` |
| `user_roles` | sin `updated_at` | con `updated_at` |
| `audit_log` | `inscription_id`, `created_at` | `record_type`, `record_id`, `timestamp`; **sin `inscription_id`** |
| Trigger auditoría | `trg_inscriptions_audit` → `log_inscription_change()` | `inscriptions_audit` → `audit_inscription_changes()` |
| Trigger timestamp | no existe | `update_inscriptions_timestamp` → `update_timestamp()` |

**Aplicar las migraciones desde cero no reproduce el sistema: falla.** La `0002`
crea una vista que referencia `i.updated_at`, columna que la `0001` nunca crea. El
trigger de la `0001` inserta en `audit_log(inscription_id, …)`, columna que no
existe en producción.

La causa está escrita en las propias migraciones: los encabezados de `0002` a
`0005` dicen "Aplica en Supabase Dashboard > SQL Editor", y la `0004` describe el
estado de "la base viva" con constraints sobre columnas que la `0001` no declara.
El schema se construyó en el editor SQL; las migraciones son notas de lo que se
hizo, no la receta para hacerlo.

Consecuencias prácticas: no se puede levantar un entorno igual a producción, no se
puede revisar un cambio de schema antes de aplicarlo, y nadie puede saber qué
tiene la base sin ir a mirarla.

## 2. Resultado esperado

`supabase/migrations/` reconstruye el sistema completo desde cero, de forma
verificable. Producción corre ese schema. Un `supabase db reset` en local produce
una base idéntica a la de producción.

## 3. La ventana que hace esto viable ahora

Producción está prácticamente vacía:

```
inscriptions:       1 fila  (adulto, submitted, 2026, creada 04-oct)
adult_forms:        1 fila
beneficiary_forms:  0 filas  ← cero datos de menores
user_roles:         1 fila
```

Reconstruir hoy cuesta casi nada. En marzo, con 80-95 fichas cargadas y datos
reales de menores, sería una migración delicada y de alto riesgo (C4). Esta spec
existe ahora por esa razón.

## 4. Alcance

### Incluye
- Extraer el schema real y completo de producción: tablas, columnas, tipos,
  defaults, constraints, índices, vistas, funciones, triggers y políticas RLS.
- Escribir un `0000_baseline.sql` limpio que lo reproduzca, corrigiendo los
  defectos conocidos (ver §6).
- Validarlo en Supabase local sobre Docker: `db reset` desde cero debe levantar la
  base sin error.
- Verificar la aplicación completa contra ese local antes de tocar producción.
- Promover el baseline a producción.
- Archivar `0001`→`0005` como histórico, sin borrarlas.
- Dejar la configuración del entorno local versionada (`config.toml`, `seed.sql`).

### No incluye
- Cambiar el modelo de datos: el baseline reproduce lo que hay, no rediseña.
  Agregar o quitar columnas es otra spec.
- Migrar datos: la única ficha de producción se trata según la decisión de Q1.
- Escribir las pruebas E2E faltantes *(spec 003)*.
- Cambios de UI o de flujos de la aplicación.

## 5. Actores

| Actor | Qué hace |
|---|---|
| Mauricio | Aprueba el baseline antes de promoverlo; decide el destino de la ficha existente; corre Docker |
| Claude | Extrae el schema, escribe el baseline, verifica el diff |
| Producción | Recibe el baseline solo al final, con la app ya verificada en local |

## 6. Defectos a corregir en el baseline

Hallazgos de la auditoría que el baseline debe arreglar, no heredar:

- **`user_roles` tiene RLS activo y ninguna política.** El linter de seguridad de
  Supabase lo reporta. Sin política, con RLS activo, nadie lee su propio rol salvo
  vía `service_role`. La `0001` sí declaraba `users_read_own_role` — otra prueba de
  que no fue lo aplicado. Violación directa de C2 y C3.
- **`audit_inscription_changes()` y `update_timestamp()` tienen `search_path`
  mutable.** Son `SECURITY DEFINER` con `search_path` sin fijar, lo que las hace
  vulnerables a secuestro por resolución de nombres. El baseline las declara con
  `set search_path = public, pg_temp`.
- **La auditoría puede no estar funcionando.** `audit_log` tiene 0 filas con una
  inscripción `submitted` registrada. Hay que determinar si la fila precede al
  trigger o si el trigger falla en silencio. C6 depende de esto.
- **Protección de contraseñas filtradas desactivada** en Supabase Auth. Es
  configuración de proyecto, no de schema, pero se resuelve en esta spec por
  oportunidad.

## 7. Comportamiento esperado

**E1 — Extracción fiel**
Dado el proyecto de producción, cuando se extrae su schema, entonces el resultado
incluye todos los objetos de §4 y ninguna fila de datos.

**E2 — El baseline levanta en local**
Dado `0000_baseline.sql` y un Supabase local vacío, cuando se corre
`supabase db reset`, entonces la base se construye sin error y sin advertencias de
objetos faltantes.

**E3 — Equivalencia verificada**
Dado el local reconstruido y producción, cuando se comparan sus schemas, entonces
las únicas diferencias son los defectos corregidos de §6, cada una justificada.

**E4 — La aplicación funciona contra el baseline**
Dado el local reconstruido, cuando se corre la aplicación y se completa un alta de
adulto y una de beneficiario de punta a punta, entonces ambas se guardan y se leen
correctamente.

**E5 — Promoción**
Dado el baseline validado y aprobado por Mauricio, cuando se aplica a producción,
entonces la aplicación desplegada sigue funcionando y el schema queda reproducible.

**E6 — Divergencia durante el trabajo**
Dado que alguien modifique producción por el editor SQL mientras esta spec está en
curso, cuando se detecte, entonces se vuelve a extraer el schema y se reinicia la
verificación. Durante esta spec, producción no se toca por fuera de ella.

## 8. Reglas de negocio

- **R1** El baseline reproduce producción. No es una oportunidad para rediseñar el
  modelo de datos.
- **R2** Toda diferencia deliberada entre el baseline y producción se justifica por
  escrito en §6. Una diferencia no justificada es un error de extracción.
- **R3** Producción se toca **una sola vez**, al final, con la aplicación ya
  verificada en local.
- **R4** `0001`→`0005` se archivan, no se borran. Son el registro de cómo se llegó
  acá.
- **R5** Desde el cierre de esta spec, **todo cambio de schema pasa por una
  migración**. Nunca por el editor SQL. Es la regla cuya ausencia causó este
  problema.
- **R6** La versión de Postgres en local se fija a 17 para igualar producción
  (17.6.1).

## 9. Criterios de aceptación

- [ ] **A1** Existe `supabase/migrations/0000_baseline.sql` que reproduce el schema
      de producción con los defectos de §6 corregidos.
- [ ] **A2** `supabase db reset` en local construye la base sin error desde cero.
- [ ] **A3** El diff entre el local reconstruido y producción no muestra ninguna
      diferencia fuera de §6.
- [ ] **A4** `get_advisors` sobre el local no reporta tabla con RLS sin política,
      vista `SECURITY DEFINER` ni función con `search_path` mutable.
- [ ] **A5** Un alta de adulto y una de beneficiario se completan de punta a punta
      contra el local.
- [ ] **A6** Está determinado si el trigger de auditoría funciona, y si no,
      corregido en el baseline (C6).
- [ ] **A7** El baseline está aplicado a producción y la aplicación desplegada
      funciona.
- [ ] **A8** `0001`→`0005` están archivadas con una nota que explica por qué.
- [ ] **A9** `config.toml` y `seed.sql` están versionados; el seed crea un admin y
      un usuario de prueba, ambos con prefijo `E2E_TEST_`.
- [ ] **A10** `AGENTS.md` §3 describe el modelo de datos real, y
      `.sdd/baseline/inventario.md` está actualizado.

## 10. Consideraciones de datos y seguridad

Producción tiene **cero fichas de beneficiarios**, así que esta reconstrucción no
pone datos de menores en riesgo. Es precisamente la razón de hacerla ahora (§3).

- La extracción de schema **no incluye datos**. No se copian, citan ni exportan
  filas de `adult_forms` ni de `beneficiary_forms`.
- El `seed.sql` contiene únicamente datos inventados con prefijo `E2E_TEST_`. Nunca
  una copia, ni parcial ni anonimizada, de datos reales.
- Los defectos de §6 son violaciones activas de C2 y C3 en producción hoy. Esta
  spec es también su corrección.

## 11. Preguntas abiertas

| # | Pregunta | Decide | Estado |
|---|---|---|---|
| Q1 | La única ficha de producción (adulto, `submitted`, oct-2026): ¿se preserva, se migra al nuevo schema, o se descarta como dato de prueba? | Mauricio | abierta |
| Q2 | ¿Se reconstruye sobre el mismo proyecto `web-platform-g1` o sobre uno nuevo que después se promueve? | Mauricio | abierta |
| Q3 | ¿El trigger de auditoría falla, o la fila existente lo precede? | Claude (verificable) | abierta |

Q1 y Q2 bloquean la promoción (A7), no la construcción del baseline. Se puede
avanzar hasta A6 sin resolverlas.

## 12. Fuera de alcance / futuro

- **003 — Cerrar la brecha de cobertura E2E**, ahora contra local.
- **004 — Limpieza estructural y de dependencias**: `next-auth` sin usar,
  `shadcn-ui` como dependencia de runtime, imagen de fondo fuera de `public/`,
  directorio `components/` vacío en la raíz.
- Documentar el modelo de datos real: 74 y 110 columnas sin descripción es deuda
  por sí misma.
