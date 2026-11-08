---
id: 001
slug: reconciliacion
titulo: Reconciliar el estado real del sistema con su documentación
estado: borrador
prioridad: alta
creada: 2026-11-01
aprobada: ---
constitucion: [C2, C5, C10]
bloquea: [002]
---

# 001 — Reconciliar el estado real del sistema con su documentación

## 1. Problema

Nadie sabe con certeza qué está implementado en este sistema.

`AGENTS.md` es el documento de contexto del proyecto, pero quedó atrás del
código en tres capas a la vez:

- **Código** — lista como pendientes tres módulos que existen en el árbol
  (`app/admin/inscripciones/[id]/`, `app/api/inscriptions/[id]/route.ts`,
  `src/components/EditorInscripcion.tsx`). No se sabe si están completos, a
  medias o abandonados.
- **Datos** — documenta `status` como `draft | submitted | rejected`, pero la
  migración `0002_approved_status.sql` añadió `approved`. Y hay dos migraciones
  de corrección (`0004`, `0005`) cuyo motivo no está registrado en ninguna parte.
- **Pruebas** — afirma cobertura E2E de proxy, login/signup, Mis Inscripciones y
  todo el panel administrativo. En el repo existen dos specs, ambas de
  formularios de usuario.

Debajo de todo esto hay una incógnita mayor: **no se sabe si la base de datos de
producción coincide con lo que dicen las migraciones**. Si alguna corrección se
aplicó pegando SQL en el editor de Supabase en vez de como migración, el
directorio `supabase/migrations/` dejó de ser la fuente de verdad del schema.

## 2. Resultado esperado

Existe un inventario verificado y confiable del sistema: qué funciona, qué está
a medias, qué no existe, y si el schema de producción es reproducible desde las
migraciones. A partir de ahí se puede planificar sin adivinar.

## 3. Alcance

### Incluye
- Determinar el estado funcional real de los tres módulos no documentados.
- Comparar el schema de producción contra el resultado de aplicar
  `0001`→`0005` en orden, y registrar toda divergencia.
- Determinar si `app/api/export/route.ts` usa `exceljs` y `pdf-lib` o sigue
  entregando CSV y HTML disfrazados.
- Confirmar que `.env.local` no está versionado.
- Actualizar `AGENTS.md` y `.sdd/baseline/inventario.md` con los hallazgos.
- Reescribir el backlog de pendientes reales en `AGENTS.md` §9.

### No incluye
- **Corregir** nada de lo que se encuentre. Esta spec audita y documenta;
  cada corrección será su propia spec.
- Terminar los módulos que resulten estar a medias.
- Escribir las pruebas E2E faltantes *(spec 003)*.
- Montar el entorno local *(spec 002, bloqueada por esta)*.
- Limpieza de dependencias y estructura *(spec 002)*.

## 4. Actores

| Actor | Qué puede hacer con esto |
|---|---|
| Mauricio | Decide el veredicto de cada módulo ambiguo; aprueba el inventario resultante |
| Claude | Lee el código, corre el diff de schema, redacta los hallazgos |
| Sistema | No cambia: esta spec no modifica comportamiento |

## 5. Comportamiento esperado

**E1 — Auditoría de código**
Dado un módulo no documentado, cuando se lee su implementación, entonces se
clasifica como `completo`, `a-medias` o `abandonado`, con la evidencia concreta
que sustenta el veredicto (qué hace, qué le falta).

**E2 — Diff de schema sin divergencia**
Dado el proyecto de producción, cuando se compara su schema contra las
migraciones aplicadas en orden desde cero, y el diff sale vacío, entonces
`supabase/migrations/` queda confirmado como fuente de verdad y la spec 002
puede proceder.

**E3 — Diff de schema con divergencia**
Dado el mismo escenario, cuando el diff muestra diferencias, entonces se
registra cada una y se decide con Mauricio si se adopta prod como verdad
(generando una migración de reconciliación) o se corrige prod. La decisión
queda en un registro de decisión; la corrección es spec aparte.

**E4 — `.env.local` versionado**
Dado el repositorio, cuando se comprueba que `.env.local` está bajo control de
versiones, entonces se trata como incidente de credenciales: rotar las claves de
Supabase y Resend, no solo quitar el archivo del índice.

**E5 — Hallazgo fuera de alcance**
Dado cualquier hallazgo que no entre en §3, cuando aparece, entonces se anota en
`.sdd/baseline/deuda-tecnica.md` y se deja como candidato a spec. No se corrige
en esta.

## 6. Reglas de negocio

- **R1** El código es la autoridad sobre la documentación. Ante conflicto, se
  corrige el documento.
- **R2** La base de datos de producción es la autoridad sobre las migraciones.
  Si divergen, prod describe la realidad; las migraciones describen una
  intención que no se cumplió.
- **R3** Un veredicto sin evidencia no es un veredicto. "Parece completo" no se
  registra; se registra qué hace y qué le falta.
- **R4** Esta spec no toca código de aplicación ni schema. La única escritura
  permitida es en documentación y, si R2 lo exige, una migración de
  reconciliación que no altere datos.
- **R5** La auditoría de schema se hace en modo lectura. No se corre
  `db push` ni `db reset` contra producción.

## 7. Criterios de aceptación

- [ ] **A1** Los tres módulos no documentados tienen veredicto
      (`completo` / `a-medias` / `abandonado`) con evidencia escrita.
- [ ] **A2** Existe el resultado del diff entre el schema de producción y las
      migraciones, con cada divergencia enumerada o la constancia de que no hay
      ninguna.
- [ ] **A3** Está determinado y documentado si la exportación Excel/PDF es real
      o simulada.
- [ ] **A4** Está verificado si `.env.local` está versionado, y si lo estaba,
      las claves fueron rotadas.
- [ ] **A5** `AGENTS.md` §3 (modelo de datos), §6 (estructura), §8 (testing) y
      §9 (pendientes) reflejan el estado real.
- [ ] **A6** `.sdd/baseline/inventario.md` no contiene ninguna fila marcada
      "verificar" ni "doc desactualizada".
- [ ] **A7** El backlog de `AGENTS.md` §9 contiene únicamente pendientes reales
      confirmados.
- [ ] **A8** Si hubo divergencia de schema, existe un registro de decisión que
      explica qué se adoptó como verdad y por qué.

## 8. Consideraciones de datos y seguridad

La auditoría de schema se hace **en lectura** contra producción. No se ejecuta
`db push` ni `db reset` contra el proyecto remoto (R5).

Producción contiene datos reales de beneficiarios menores de edad: nombre, fecha
de nacimiento, dirección, escolaridad, datos médicos y vacunas. En consecuencia,
y por **C2**:

- El diff se hace sobre **estructura**, nunca sobre contenido de filas. No se
  extraen, copian ni citan datos de beneficiarios en los documentos de esta spec.
- Si se necesita verificar comportamiento con datos, se usan filas prefijadas
  `E2E_TEST_` o se espera a tener el entorno local (spec 002).
- Ningún hallazgo documentado incluye valores de columnas médicas o de
  identificación.

**Hallazgo colateral que justifica la urgencia de 002:** hoy las pruebas E2E
corren contra producción, de modo que cada ejecución escribe inscripciones
ficticias en las mismas tablas que las reales y consume cuota de Resend de
producción. Esto es un roce directo con C2 y es el argumento más fuerte para
priorizar el entorno local.

## 9. Preguntas abiertas

| # | Pregunta | Decide | Estado |
|---|---|---|---|
| Q1 | Si prod divergió de las migraciones, ¿se adopta prod como verdad (migración de reconciliación) o se corrige prod? | Mauricio | abierta — depende de A2 |
| Q2 | ¿Las migraciones `0004` y `0005` se aplicaron por CLI o pegadas en el editor SQL? | Mauricio | abierta |
| Q3 | ¿`EditorInscripcion.tsx` se llegó a conectar a una ruta, o quedó huérfano? | Claude (lectura) | abierta |

## 10. Fuera de alcance / futuro

- **002 — Entorno de desarrollo local** (bloqueada por esta spec; ver
  `.sdd/decisiones/0001-entorno-local-supabase.md`).
- **003 — Cerrar la brecha de cobertura E2E.**
- Limpieza de dependencias: `next-auth` sin usar, `shadcn-ui` como dependencia
  de runtime, imagen de fondo fuera de `public/`.
- Documentar el motivo de las correcciones de constraints en `0004` y `0005`,
  para no reintroducir el error.
