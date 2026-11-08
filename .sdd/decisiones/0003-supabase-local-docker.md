---
id: 0003
titulo: Supabase local en Docker como banco de trabajo y entorno de pruebas
estado: aceptada
fecha: 2026-11-07
decide: Mauricio Rivas
supersede: 0002
constitucion: [C1, C2, C4, C11]
relacionada: [spec 001, spec 002]
---

# 0003 — Supabase local en Docker como banco de trabajo y entorno de pruebas

**Supersede a [0002](0002-entorno-de-pruebas-segundo-proyecto.md).**

## Por qué hubo tres decisiones sobre lo mismo

Vale dejarlo escrito para no repetir el vaivén:

| | Decisión | Qué la movió |
|---|---|---|
| 0001 | Stack local con Supabase CLI | Las pruebas no deben tocar datos reales de menores ni la cuota de Resend |
| 0002 | Segundo proyecto Supabase | Mauricio no quería depender de un stack local |
| **0003** | **Supabase local en Docker** | **Ya lo usa y le funciona: lo aplicó en el proyecto del Calendario** |

El problema nunca cambió. Lo que cambió es la información: 0001 propuso local sin
saber si Docker era viable en su máquina, y 0002 lo descartó por esa duda. La duda
está resuelta — Mauricio corrió Supabase en Docker para migrar usuarios de Lovable
a un proyecto Supabase propio en el Calendario del Clan Maya. La objeción
principal de 0002 ya no aplica.

## Decisión

**Supabase local en Docker**, con dos funciones:

1. **Banco de trabajo** para construir y validar el schema limpio de la spec 002
   antes de promoverlo a producción. Es el mismo patrón que Mauricio ya usó en el
   Calendario: construir fuera, validar, y promover a un proyecto que controla.
2. **Entorno de pruebas** permanente: la suite E2E corre contra local, no contra
   producción.

**Se descarta el segundo proyecto Supabase.** Razones:

- Local cubre la necesidad de pruebas mejor: no se pausa por inactividad, que era
  el único defecto reconocido de la opción de 0002.
- Deja libre el único slot restante del free tier (C1).
- Una herramienta que Mauricio ya domina pesa más que una alternativa teórica.

Si más adelante hace falta un staging gestionado previo a producción —por ejemplo
para validar con otro administrador antes de abrir la temporada— el slot sigue
disponible y se reabre entonces.

## Qué se conserva de 0001 y 0002

De 0001, el flujo completo y la advertencia de disciplina. De 0002, la práctica de
prefijar los datos de prueba con `E2E_TEST_` y limpiarlos siempre en el teardown.

## Disciplina obligatoria

**Todo cambio de schema pasa por una migración, nunca por el editor SQL de
Supabase.** Esto no es preferencia de estilo: es exactamente lo que se rompió. La
auditoría de la spec 001 encontró que producción y `supabase/migrations/` son dos
sistemas distintos —74 vs 41 columnas en `adult_forms`, 110 vs ~40 en
`beneficiary_forms`, triggers con otros nombres y otra función— porque el schema se
construyó en el editor y las migraciones quedaron como notas de lo que se hizo.

Un entorno local no sirve de nada si el schema vuelve a divergir por la misma vía.

## Consecuencias

**Positivas**
- Los datos reales salen del circuito de pruebas (C2).
- Se deja de consumir cuota de Resend de producción.
- `db reset` reconstruye desde cero en orden, lo que vuelve las migraciones
  verificables en vez de declaradas.
- Sin costo y sin gastar el slot libre (C1).
- No se pausa por inactividad, a diferencia de un proyecto free.

**Costos aceptados**
- Dependencia de Docker Desktop en la máquina de desarrollo.
- Consumo de memoria local mientras el stack corre.
- La versión local de Postgres debe fijarse a 17 en `config.toml` para igualar
  producción (17.6.1).
