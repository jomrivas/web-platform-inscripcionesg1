---
id: 0002
titulo: Entorno de pruebas en un segundo proyecto Supabase, descartando el stack local
estado: superseded
superseded_por: 0003
fecha: 2026-11-07
decide: Mauricio Rivas
supersede: 0001
constitucion: [C1, C2, C4]
relacionada: [spec 001, spec 002]
---

# 0002 — Entorno de pruebas en un segundo proyecto Supabase

> **Superseded por [0003](0003-supabase-local-docker.md)** (2026-11-07).
> Se confirmo que Mauricio ya corre Supabase en Docker (lo uso en el proyecto
> del Calendario), asi que la duda sobre la viabilidad de Docker —la objecion
> central de esta decision— quedo resuelta. El segundo proyecto se descarta.

**Supersede a [0001](0001-entorno-local-supabase.md).** El problema que 0001
buscaba resolver sigue siendo el mismo; cambia la solución.

## Contexto

La decisión 0001 eligió un stack local con Supabase CLI (Docker) como entorno de
pruebas. Mauricio la descartó: no quiere depender de un stack local y prefiere
mantener todo en Supabase gestionado.

La razón original de 0001 **no era preferencia por local**, y sigue vigente:

- Las pruebas E2E crean inscripciones. Cada corrida escribe fichas ficticias de
  beneficiarios en las mismas tablas que contienen datos reales de menores (C2).
- Cada corrida consume cuota de Resend de producción: 100 emails/mes, de los
  cuales ~95 es el consumo real estimado de la temporada (C1).

Descartar local sin reemplazo dejaría ese problema intacto.

## Decisión

**Segundo proyecto Supabase del free tier, dedicado a pruebas.** Producción y
pruebas quedan en proyectos separados del mismo servicio gestionado. Nada local,
nada de Docker.

### Por qué es viable ahora

La organización tiene **un solo proyecto** (`web-platform-g1`, Postgres 17.6.1,
`ca-central-1`), así que queda 1 slot libre de los 2 del free tier.

### La objeción de 0001, reevaluada

0001 descartó esta opción porque los proyectos free **se pausan tras una semana
de inactividad** y hay que restaurarlos a mano desde el dashboard.

Esa objeción pesaba cuando el candidato era el entorno de desarrollo cotidiano:
encontrarlo dormido cada vez que se retoma el trabajo es fricción constante. Pero
para un proyecto que existe solo para correr la suite E2E —una acción
deliberada, no un servicio de fondo— despertarlo es un clic antes de la corrida.
El costo es tolerable y la objeción no alcanza para descartarla.

## Opciones consideradas en este replanteo

| Opción | Veredicto |
|---|---|
| **A. Segundo proyecto Supabase para pruebas** | **Elegida** |
| B. Todo en el proyecto único, pruebas como están | Descartada: deja intacto el roce con C2 y el consumo de cuota |
| C. Proyecto único, con mitigación parcial (sin email real, limpieza siempre) | Descartada como solución; se adopta igual lo que aporte (ver abajo) |

De **C** se conserva lo que es buena práctica de todos modos y no depende del
proyecto separado: los datos de prueba se prefijan `E2E_TEST_` y el teardown los
limpia siempre.

## Condición previa bloqueante (sin cambios respecto a 0001)

Sigue vigente: el proyecto de pruebas solo es útil si su schema coincide con
producción, y eso exige saber si producción coincide con las migraciones
`0001`→`0005`. Esa verificación es el criterio **A2 de la spec 001**.

El montaje del entorno de pruebas sigue siendo la **spec 002**, bloqueada por la
001.

## Consecuencias

**Positivas**
- Los datos reales de menores salen del circuito de pruebas (C2).
- Se deja de consumir cuota de Resend de producción en cada corrida.
- No se introduce ninguna dependencia local: sin Docker, sin consumo de memoria
  de la laptop, sin un segundo stack que mantener.
- Fidelidad máxima: es el mismo servicio gestionado, no una emulación.

**Negativas o costos aceptados**
- El proyecto de pruebas se pausa tras una semana sin uso; hay que despertarlo
  antes de correr la suite.
- Se gasta el único slot libre del free tier. Si más adelante hace falta un
  tercer entorno, ya no hay espacio gratis.
- Dos proyectos cuyo schema hay que mantener sincronizado. Se mitiga con la misma
  disciplina que exigía 0001: **todo cambio de schema pasa por una migración**,
  nunca por el editor SQL. Romper esto reintroduce exactamente el problema que
  la spec 001 está auditando.

**A revisar**
- Si el slot libre se necesita para otra cosa, reabrir con la opción C como
  mitigación de respaldo.
