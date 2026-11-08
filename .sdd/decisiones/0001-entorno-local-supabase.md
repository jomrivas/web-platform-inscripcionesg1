---
id: 0001
titulo: Entorno de pruebas local con Supabase CLI en vez de un segundo proyecto remoto
estado: superseded
superseded_por: 0002
fecha: 2026-11-01
decide: Mauricio Rivas
constitucion: [C1, C2, C4]
relacionada: [spec 001, spec 002]
---

# 0001 — Entorno de pruebas local con Supabase CLI

> **Superseded por [0002](0002-entorno-de-pruebas-segundo-proyecto.md)** (2026-11-07).
> Mauricio descartó el stack local. El problema que esta decisión buscaba
> resolver sigue vigente y lo recoge la 0002; el análisis de opciones de aquí
> se conserva como registro, en particular la reevaluación de la opción B.

## Contexto

El proyecto se construyó apuntando directamente a producción: la base de datos
se creó en Supabase y el despliegue se hizo en Vercel, sin un entorno intermedio.
Hoy toda prueba — manual o automatizada — corre contra el sistema que atiende a
las familias del grupo.

Esto tiene dos consecuencias concretas:

1. **Riesgo sobre datos reales.** Las pruebas E2E crean inscripciones. Cada
   ejecución escribe fichas ficticias de beneficiarios en las mismas tablas que
   contienen datos reales de menores, y consume cuota de Resend de producción
   (100 emails/mes, de los cuales ~95 son el consumo real estimado de la
   temporada).
2. **Fricción de desarrollo.** No hay forma de probar una migración o un cambio
   de RLS sin aplicarlo a producción.

Mauricio planteó mover las pruebas a un entorno local y promover a producción
solo cuando todo pase en verde.

### Estado verificado al momento de decidir

- La organización tiene **un solo proyecto**: `web-platform-g1`, Postgres
  **17.6.1**, región `ca-central-1`. Queda 1 slot libre de los 2 del free tier.
- Existen cinco migraciones ordenadas en `supabase/migrations/`
  (`0001`→`0005`). Este es el artefacto que hace viable un entorno local
  reproducible.
- **No existe `supabase/config.toml`**: nunca se corrió `supabase init`.
- La CLI de Supabase corre sin instalación previa (`npx supabase`, v2.122.0
  resuelta correctamente).
- No se pudo verificar si hay Docker Desktop en la máquina: el shell disponible
  corre en un entorno Linux aislado, no en el Windows del usuario.

## Opciones consideradas

### A. Stack local con Supabase CLI — **elegida**

Postgres, Auth, Storage y Studio corriendo en contenedores locales, reconstruidos
desde las migraciones con `supabase db reset`.

**A favor**
- Costo $0, no consume ningún slot del free tier (C1).
- Fidelidad alta: es el mismo Postgres y el mismo motor de Auth, así que las
  políticas RLS y `auth.uid()` se ejercitan de verdad.
- `db reset` reconstruye desde cero en orden, lo que convierte las migraciones
  en fuente de verdad verificable en lugar de declarada.
- Sin red de por medio: las pruebas corren rápido y sin cuota.
- Los datos reales de menores quedan fuera del circuito de pruebas (C2).

**En contra**
- Requiere un runtime compatible con Docker. En Windows, Docker Desktop
  (pendiente de confirmar si está instalado).
- Consume memoria de la laptop personal: el stack son varios contenedores.
- Requiere disciplina: toda modificación de schema debe pasar por una migración,
  nunca por el editor SQL.

### B. Segundo proyecto Supabase free como staging — descartada

**A favor**
- Fidelidad máxima: es literalmente el mismo servicio gestionado.
- No requiere Docker ni recursos locales.
- Hay un slot libre.

**En contra, y es decisivo**
- **Los proyectos free se pausan tras una semana de inactividad**, y un proyecto
  pausado queda inalcanzable hasta restaurarlo a mano desde el dashboard. El uso
  de este sistema es estacional por diseño (pico marzo-abril, esporádico el resto
  del año, C4): el entorno de pruebas estaría dormido justo cada vez que se
  retoma el trabajo.
- Gastaría el único slot libre en algo que no puede ser el entorno cotidiano.

### C. Postgres local plano, sin Supabase — descartada

**En contra**
- No provee `auth.uid()` ni el esquema `auth`, así que las políticas RLS no se
  pueden ejercitar. Probar la app sin poder probar su capa de autorización es
  inaceptable en un sistema que custodia datos de menores (C2, C3).

### D. Supabase branching — descartada

**En contra**
- Requiere plan Pro. Viola C1 directamente.

## Decisión

Se adopta **A: stack local con Supabase CLI**, con `supabase/migrations/` como
fuente de verdad del schema y promoción a producción vía `db push` únicamente
cuando la suite pasa en local.

**B queda como opción futura**, no como reemplazo: si más adelante se quiere un
staging real previo a producción —por ejemplo para validar con otro
administrador antes de abrir la temporada— el slot libre sigue disponible. Su
limitación de pausa es tolerable para un uso puntual y previsto; no para el ciclo
de desarrollo diario.

## Condición previa bloqueante

Esta decisión **no se implementa todavía**. Un entorno local reconstruido desde
las migraciones solo es fiel si producción coincide con esas migraciones.

Hay motivo concreto de sospecha: `0004_fix_adult_form_constraints.sql` y
`0005_fix_beneficiary_form_constraints.sql` son correcciones. Si alguna se aplicó
pegando SQL en el editor de Supabase en lugar de como migración, prod y las
migraciones divergieron, y el entorno local sería fiel a un archivo en vez de a
la realidad.

Por eso la verificación de deriva de schema se incorporó al alcance de la
**spec 001** (criterio A2), y el montaje del entorno local pasa a ser la
**spec 002**, bloqueada por ella. No tiene sentido construir un local fiel antes
de saber a qué debe ser fiel.

## Flujo resultante (spec 002)

```
npx supabase init                 → config.toml, fijar major_version = 17
npx supabase start                → stack local, Studio en :54323
npx supabase db reset             → aplica 0001→0005 desde cero
supabase/seed.sql                 → admin + usuario de prueba, prefijo E2E_TEST_
.env.local       → local
.env.production  → producción
Playwright       → apunta a localhost
npx supabase db push              → solo con la suite en verde
```

## Consecuencias

**Positivas**
- Los datos reales de menores dejan de estar en el circuito de pruebas.
- Se deja de consumir cuota de Resend de producción en cada corrida.
- Las migraciones pasan a estar verificadas, no solo declaradas.
- Se puede probar un cambio de RLS sin exponer producción.

**Negativas o costos aceptados**
- Dependencia de Docker Desktop en la máquina de desarrollo.
- Disciplina obligatoria: ningún cambio de schema por el editor SQL. Romper esto
  reintroduce exactamente el problema que esta decisión resuelve.
- Dos archivos de entorno que mantener sincronizados en estructura.

**A revisar**
- Si Docker Desktop resulta no instalable en la máquina, reabrir esta decisión
  con B como candidata, asumiendo su limitación de pausa.
