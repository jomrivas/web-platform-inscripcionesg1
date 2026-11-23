---
id: 005
slug: rediseno-ux-ui
titulo: Rediseño UX/UI de toda la app con la identidad del Grupo Scout No. 1
estado: borrador
prioridad: alta
creada: 2026-11-22
aprobada: ---
constitucion: [C2, C5, C7, C8, C9, C10, C11]
depende: [002]
bloquea: [promoción a producción (A7 de la 002)]
diseño: "Lienzo «Inscripciones G1 — Rediseño UX/UI» (Artifact de diseño, 9 tableros)"
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

- **Diseño aprobado:** lienzo «Inscripciones G1 — Rediseño UX/UI»: base visual,
  6 pantallas móviles de familia y 2 de administración.
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
- **Las 11 páginas:** landing, ingreso, registro, inicio, elegir tipo, ficha de
  adulto, ficha de beneficiario, mis inscripciones, panel admin, listados y
  revisión de inscripción.
- **Fichas: de pestañas a pasos.** Cada pestaña actual pasa a ser un paso, en
  el mismo orden y con los mismos campos (ver §6).
- **Mobile first** para todo el flujo de familias; escritorio para el admin, que
  igual debe poder usarse en un teléfono sin romperse.
- **Accesibilidad:** asociar cada `<label>` a su campo con `htmlFor`/`id`. Hoy no
  lo están (decisión documentada en `AGENTS.md` §7). Se agrega `id` sin tocar
  `name`, así que las pruebas no cambian.

### No incluye

- **Cambios de schema, de API ni de validaciones.** Es un rediseño visual y de
  navegación.
- **Renombrar ningún atributo `name`** (C8): coinciden con columnas de la base y
  son los selectores de las pruebas.
- **Las funciones nuevas que el lienzo insinúa.** Cada una cambia comportamiento
  o datos, así que va en su propia spec (ver §11):
  guardar borrador a mitad de ficha, que la familia vea el motivo de rechazo,
  historial con el admin que aprobó, lista "Ten a mano" dinámica.
  El lienzo las muestra como dirección futura; esta spec implementa su aspecto
  donde el dato ya existe y las omite donde no.

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

## 9. Criterios de aceptación

- [ ] **A1** Existen los tokens en el tema de Tailwind y ningún componente usa un
      hex suelto (búsqueda en `app/` y `src/`).
- [ ] **A2** Las 11 páginas siguen el lienzo aprobado.
- [ ] **A3** Ambas fichas funcionan por pasos y cumplen E1, E2 y E3.
- [ ] **A4** A 360 px ninguna página de familia tiene desplazamiento horizontal
      (E4), verificado con Playwright.
- [ ] **A5** El panel admin es usable en teléfono (E5).
- [ ] **A6** El diff de la spec no cambia ningún atributo `name` (R1).
- [ ] **A7** Las pruebas E2E existentes pasan sin modificar sus selectores.
- [ ] **A8** Todo `<label>` de las fichas está asociado a su campo.
- [ ] **A9** Contraste y áreas tocables cumplen R3 y R4.
- [ ] **A10** Logo, isotipo y favicon en su lugar; la fuente carga sin CDN.
- [ ] **A11** Alta de adulto y de beneficiario y aprobación desde el panel
      funcionan de punta a punta contra Supabase local, igual que en el A5 de la 002.
- [ ] **A12** `AGENTS.md` §6 y §7 describen la estructura y las decisiones nuevas.

## 10. Datos y seguridad

Sin cambios de datos. Las capturas de pantalla y pruebas usan solo usuarios y
fichas `E2E_TEST_`, nunca datos reales (C2). Las fichas son de menores: los
mockups y la documentación no muestran datos reales.

## 11. Fuera de alcance — candidatos a spec

Salen del lienzo y quedan registrados para no perderlos:

- **Guardar borrador a mitad de ficha.** El estado `draft` existe, pero el flujo
  no lo usa así.
- **La familia ve el motivo de rechazo.** Hoy `rejection_reason` solo lo ve el
  admin.
- **Historial con el admin que aprobó.** Depende de corregir que `audit_log`
  no registra la identidad del admin (hallazgo abierto en `RETOMAR.md`).
- **Sección administrativa de la ficha de beneficiario.** La tabla tiene campos
  del proceso de inducción, pagos e investidura que la ficha actual no muestra.

## 12. Preguntas abiertas

| # | Pregunta | Decide | Estado |
|---|---|---|---|
| Q1 | ¿Se implementa por partes (base y componentes → familia → admin) con un commit verificado por parte, o todo de una vez? | Mauricio | abierta — recomendación: por partes |
| Q2 | ¿La landing pública se rediseña con el mismo peso, o basta con que lleve al ingreso? | Mauricio | abierta |
