---
id: 005
slug: rediseno-ux-ui
titulo: Rediseño UX/UI de toda la app con la identidad del Grupo Scout No. 1
estado: cerrada
prioridad: alta
creada: 2026-11-22
aprobada: 2026-11-22
enmendada: 2026-11-24 (ver §13)
cerrada: 2026-11-24
constitucion: [C2, C5, C7, C8, C9, C10, C11]
depende: [002]
bloquea: [promoción a producción (A7 de la 002)]
diseño: "Lienzo «Inscripciones G1 — Rediseño UX/UI» (Artifact de diseño, 11 tableros)"
decision: 0004
---

# 005 — Rediseño UX/UI de toda la app

## 1. Problema

La app funciona pero no se ve como del Grupo Scout No. 1: usa los estilos por
defecto de Tailwind, no tiene logo ni colores propios, y las fichas largas se
llenan en pestañas pensadas para escritorio. Las familias, que son el usuario
prioritario, van a inscribirse sobre todo desde el celular.

Además se va a promover a producción una sola vez. Si el rediseño queda para
después, producción se toca dos veces.

## 2. Resultado esperado

La app completa tiene una identidad moderna, minimalista y fresca, basada en el
logo del grupo; el flujo de las familias está pensado primero para móvil y el
panel administrativo para escritorio. Nada de lo que hoy funciona deja de
funcionar.

## 3. Referencias

- **Diseño aprobado:** lienzo «Inscripciones G1 — Rediseño UX/UI»: portada
  (escritorio y móvil), base visual, 6 pantallas móviles de familia y 2 de
  administración.
- **Referencia de la portada:** el ingreso de *Calendar Check Clan Maya*
  (`calendar-clanmaya-g1.vercel.app/login`), de la que se toma la **estructura**:
  pantalla partida en escritorio, panel de marca a la izquierda, titular a dos
  tonos y franja decorativa abajo. No se toma su identidad (C7): la greca maya
  se reemplaza por una franja con los cuatro colores de rama del logo.
- **Identidad aprobada:** decisión `0004` — azul del logo `#0E1754` y blanco,
  colores por rama, Nunito.
- **Referencias de estilo de Mauricio:** formulario multipaso en móvil (un paso
  por pantalla, indicador arriba, Atrás/Siguiente abajo) y revisión en
  escritorio por secciones con estado.
- **Recursos:** `public/brand/` (SVG y PNG del logo, isotipo color y blanco).
  Fuentes editables en `design/brand/`, fuera de lo que se publica.

## 4. Alcance

### Incluye

- **Tokens de diseño** en el tema de Tailwind 4: colores, tipografía, radios,
  sombras. Un solo lugar de verdad; ningún hex suelto en los componentes.
- **Tipografía Nunito** cargada con `next/font`, sin dependencia de un CDN.
- **Marca:** logo en el ingreso (negativo blanco), en el panel admin (color) y
  en el inicio (isotipo); favicon e ícono de la app desde el isotipo.
- **Componentes base** reutilizables: botón (primario, secundario, peligro),
  campo con etiqueta, ayuda y error, chip de estado, chip de rama, indicador de
  pasos, tarjeta, navegación inferior móvil, barra lateral admin.
- **Las 11 páginas:** portada, ingreso, registro, inicio, elegir tipo, ficha de
  adulto, ficha de beneficiario, mis inscripciones, panel admin, listados y
  revisión de inscripción.
- **Portada al mismo nivel que el resto**, según sus dos tableros. En
  escritorio, ingreso y registro reutilizan la misma pantalla partida de la
  portada; en móvil siguen el tablero *1 · Ingreso*.
- **Fichas: de pestañas a pasos.** Cada pestaña actual pasa a ser un paso, en
  el mismo orden y con los mismos campos (ver §6).
- **Mobile first** para todo el flujo de familias; escritorio para el admin, que
  igual debe poder usarse en un teléfono sin romperse.
- **Accesibilidad:** asociar cada `<label>` a su campo con `htmlFor`/`id`. Hoy no
  lo están (decisión documentada en `AGENTS.md` §7). Se agrega `id` sin tocar
  `name`, así que las pruebas no cambian.

### No incluye

- **Cambios de schema, de API ni de validaciones**, con una sola excepción:
  el correo obligatorio de cada tutor (E7, R9), agregada por enmienda. Fuera
  de eso, es un rediseño visual y de navegación.
- **Renombrar ningún atributo `name`** (C8): coinciden con columnas de la base y
  son los selectores de las pruebas.
- **Las funciones nuevas que el lienzo insinúa.** Cada una cambia comportamiento
  o datos, así que va en su propia spec (ver §11):
  que la familia vea el motivo de rechazo,
  historial con el admin que aprobó, lista "Ten a mano" dinámica.
  El lienzo las muestra como dirección futura; esta spec implementa su aspecto
  donde el dato ya existe y las omite donde no.

### Excluido por decisión: guardar borrador a mitad de ficha

Mauricio lo descarta explícitamente. Si el responsable puede dejar la ficha a
medias, en la práctica corre el riesgo de no terminarla, y el grupo necesita
los datos completos para la inscripción anual ante la ASES. La ficha se llena,
se firma y se envía en una sola sesión. El lienzo ya no muestra *Guardar* ni
fichas en borrador. Queda como mejora futura (§11).

## 5. Actores

| Actor | Dispositivo principal | Qué cambia para él |
|---|---|---|
| Familia (usuario `user`) | Celular | Flujo paso a paso, botones grandes, menos texto por pantalla |
| Admin | Laptop / PC | Barra lateral, tabla con filtros, revisión por secciones |

## 6. Estructura de las fichas

Se conserva la agrupación actual. Cada pestaña es un paso; nada se mueve de un
paso a otro.

| Ficha | Pasos |
|---|---|
| **Beneficiario** (5) | Datos personales · Padres/Tutores · Escolaridad · Datos médicos · Firmas |
| **Adulto voluntario** (7) | Ficha · Datos personales · Seguro / Emergencia · Datos médicos · Trayectoria Scout · Documentos · Firmas |

El lienzo dibuja seis pasos para beneficiario, con la rama como paso propio.
Se descarta para esta spec: mantener la agrupación actual reutiliza la lógica
que ya lleva al usuario al paso donde está el error, y no agrega riesgo.

## 7. Comportamiento esperado

**E1 — Avanzar por pasos.** Dado un paso con campos obligatorios vacíos o
inválidos, cuando la familia toca *Siguiente*, entonces no avanza, el primer
campo con error recibe el foco y el mensaje dice qué falta y cómo corregirlo.

**E2 — Volver sin perder datos.** Dado un paso ya llenado, cuando la familia toca
*Atrás* y luego *Siguiente*, entonces lo escrito sigue ahí.

**E3 — Envío con errores en otro paso.** Dado un error que solo detecta el
servidor, cuando la ficha se envía, entonces se abre el paso donde está ese
campo, con el error a la vista. (Hoy pasa con las pestañas; se conserva.)

**E4 — Celular angosto.** Dada una pantalla de 360 px de ancho, cuando se abre
cualquier página de familia, entonces no hay desplazamiento horizontal y todo
botón o campo tocable mide al menos 44 px de alto.

**E5 — Panel admin en teléfono.** Dado el panel admin en un teléfono, entonces la
barra lateral se apila arriba y la tabla se desplaza dentro de su propia caja,
sin romper la página.

**E6 — Estados y ramas.** En listados y fichas, el estado de cada inscripción se
muestra con su chip (aprobada, en revisión, rechazada, borrador) y la rama con
su color: Manada amarillo, Unidad Scout verde, Comunidad de Caminantes celeste,
Clan Rover rojo. El color nunca es la única señal: siempre va con el texto.

**E7 — Correo de cada tutor.** Dado un tutor registrado en la ficha de
beneficiario (madre o padre con nombre), cuando su correo está vacío o no
tiene formato válido, entonces la ficha no avanza ni se envía, y el campo
muestra el error. El tutor que no se registra no necesita correo.

## 8. Reglas

- **R1** Ningún `name` de input cambia (C8). Se verifica con un diff.
- **R2** Todo color, tamaño de fuente, radio y sombra sale de los tokens.
- **R3** Contraste de texto mínimo 4.5:1 (3:1 para texto de 24 px o más).
- **R4** Áreas tocables de al menos 44 × 44 px.
- **R5** Etiquetas de rama visibles: `Manada`, `Unidad Scout`,
  `Comunidad de Caminantes`, `Clan Rover`. Los valores guardados no cambian
  (`manada_7_10`, `scouts_11_14`, `caminantes_15_17`, `rovers_18_21`).
- **R6** La identidad es la del Grupo Scout No. 1, nunca la del Clan Maya (C7).
- **R7** Next 16 + React 19: consultar `node_modules/next/dist/docs/` antes de
  usar APIs de framework (C11), en particular `next/font` e imágenes.
- **R8** Se trabaja contra Supabase local. Nada de este rediseño toca producción
  hasta la promoción de la 002.
- **R9** Regla de E7, validada en el servidor en `lib/validators.ts` (C5): si
  `madre_nombre` tiene valor, `madre_email` es obligatorio y válido; igual con
  `padre_nombre` y `padre_email`. La regla actual de al menos un tutor se
  mantiene. El cliente la refleja (`required`, sin "opcional" en la etiqueta),
  pero no la reemplaza. Las columnas siguen aceptando vacío: no hay migración,
  y las fichas ya guardadas sin correo no se tocan.

## 9. Criterios de aceptación

- [ ] **A1** Existen los tokens en el tema de Tailwind y ningún componente usa un
      hex suelto (búsqueda en `app/` y `src/`).
- [ ] **A2** Las 11 páginas siguen el lienzo aprobado, portada incluida.
- [ ] **A3** Ambas fichas funcionan por pasos y cumplen E1, E2 y E3.
- [ ] **A4** A 360 px ninguna página de familia tiene desplazamiento horizontal
      (E4), verificado con Playwright.
- [ ] **A5** El panel admin es usable en teléfono (E5).
- [ ] **A6** El diff de la spec no cambia ningún atributo `name` (R1).
- [ ] **A7** Las pruebas E2E existentes pasan sin modificar sus selectores.
      Única excepción, por R9: los datos de prueba del beneficiario agregan
      `madre_email` y `fillTutor` del POM lo llena (C9).
- [ ] **A8** Todo `<label>` de las fichas está asociado a su campo.
- [ ] **A9** Contraste y áreas tocables cumplen R3 y R4.
- [ ] **A10** Logo, isotipo y favicon en su lugar; la fuente carga sin CDN.
- [ ] **A11** Alta de adulto y de beneficiario y aprobación desde el panel
      funcionan de punta a punta contra Supabase local, igual que en el A5 de la 002.
- [ ] **A12** `AGENTS.md` §6 y §7 describen la estructura y las decisiones nuevas.
- [ ] **A13** E7 y R9 cubiertos por E2E: tutor sin correo es rechazado por el
      servidor, y madre con correo + padre sin registrar pasa.

## 10. Datos y seguridad

Sin cambios de datos. Las capturas de pantalla y pruebas usan solo usuarios y
fichas `E2E_TEST_`, nunca datos reales (C2). Las fichas son de menores: los
mockups y la documentación no muestran datos reales.

## 11. Fuera de alcance — candidatos a spec

Salen del lienzo y quedan registrados para no perderlos:

- **Guardar borrador a mitad de ficha** — mejora futura, excluida a propósito
  hoy (§4). Si se retoma, debería incluir recordatorios para que la ficha no
  quede sin terminar.
- **La familia ve el motivo de rechazo.** Hoy `rejection_reason` solo lo ve el
  admin.
- **Historial con el admin que aprobó.** Depende de corregir que `audit_log`
  no registra la identidad del admin (hallazgo abierto en `RETOMAR.md`).
- **Sección administrativa de la ficha de beneficiario.** La tabla tiene campos
  del proceso de inducción, pagos e investidura que la ficha actual no muestra.

## 12. Preguntas abiertas

| # | Pregunta | Decide | Estado |
|---|---|---|---|
| Q1 | ¿Se implementa por partes o todo de una vez? | Mauricio | **resuelta 2026-11-22:** en 3 etapas — (1) tokens, fuente, marca y componentes base; (2) portada y flujo de familias; (3) panel admin. Un commit verificado por etapa |
| Q2 | ¿La landing pública se rediseña con el mismo peso? | Mauricio | **resuelta 2026-11-22:** sí, con la estructura del ingreso de Calendar Check Clan Maya (ver §3) |
| Q3 | ¿El correo del tutor es obligatorio y bajo qué regla? | Mauricio | **resuelta 2026-11-24:** sí, opción A — cada tutor registrado lleva su correo (E7, R9). Descartada la B (al menos un correo por ficha) |

## 13. Enmiendas

**2026-11-24** — Revisión del lienzo con Mauricio. Look and feel aprobado.

- **Correo de tutor obligatorio** (Q3): agrega E7, R9 y A13, y ajusta A7.
- **Textos fijos del producto**, que la etapa 2 implementa tal cual:
  - Periodo: **Inscripciones 2027-2028** en todas las pantallas. La inscripción
    anual va de marzo 2027 a febrero 2028 según la ASES; se usa ese rango para
    no confundir la inscripción al grupo con la de la ASES.
  - Lema: siempre **«¡Siempre listos para servir!»**, con signos de apertura y
    cierre.
  - Afiliación: **«miembro inscrito a la ASES»**.
  - Calendario: **inscripción ordinaria: marzo**. Desde abril es extraordinaria.

**2026-11-24 — Cierre.** Implementada en tres commits (`5440764`, `07bb684` y el
de la etapa 3). Criterios A1–A12 cumplidos, con estas notas:

- **A1:** única excepción, el HTML del correo de confirmación en
  `app/api/inscriptions/route.ts` (los clientes de correo necesitan colores en
  línea).
- **A7:** 11 de 12 pruebas pasan. La que falla lo hace igual antes y después
  del rediseño: `[PENDIENTE-1]`, UNIQUE(dui) global con dos pruebas que usan el
  mismo DUI.
- **A11:** Mauricio aprobó dos fichas y rechazó una con motivo desde el panel,
  contra Supabase local. El flujo de familia lo validó también desde su iPhone.
- **Fuera del lienzo, a propósito:** historial en la revisión (§11), recuperar
  contraseña, casilla de confirmación de datos, "¿Con quién vive?" y la ficha
  de solo lectura en la revisión admin (se mantiene editable).

