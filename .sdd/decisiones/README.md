# Registros de decisión

Decisiones de arquitectura o proceso con consecuencias duraderas: qué se
eligió, qué se descartó y **por qué**. Un registro no se borra ni se edita para
cambiar su sentido; si una decisión se revierte, se escribe una nueva que la
supersede y se marca la anterior como `superseded`.

El valor está en el *por qué*: en seis meses el código muestra qué se hizo, pero
solo esto explica qué alternativas se evaluaron y qué restricción las descartó.

## Cuándo escribir uno

- Se eligió entre opciones con trade-offs reales.
- La decisión es costosa de revertir.
- Alguien razonable podría preguntar más adelante "¿por qué no hicieron X?".

No escribir uno para decisiones obvias o reversibles en minutos.

## Estados

| Estado | Significado |
|---|---|
| `propuesta` | En discusión |
| `aceptada` | Vigente |
| `superseded` | Reemplazada; indicar por cuál |
| `revertida` | Se deshizo; indicar motivo |

## Registro

| ID | Título | Estado | Fecha |
|---|---|---|---|
| 0001 | Entorno de pruebas local con Supabase CLI en vez de un segundo proyecto remoto | superseded por 0002 | 2026-11-01 |
| 0002 | Entorno de pruebas en un segundo proyecto Supabase, descartando el stack local | aceptada | 2026-11-07 |
