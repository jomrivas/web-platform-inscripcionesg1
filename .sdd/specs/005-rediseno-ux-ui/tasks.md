# 005 — Tareas

## Etapa 1 — Base visual

- [x] T1 Tokens en `app/globals.css` y fuente Nunito en `app/layout.tsx`
- [x] T2 Favicon, `icon.png` y `apple-icon.png` desde el isotipo
- [x] T3 `lib/ramas.ts` con etiquetas R5
- [x] T4 Componentes base en `src/components/ui/`
- [x] T5 Verificación: tsc, lint y build pasan. E2E: mismo resultado que antes del cambio (5/6 en adulto; la falla es [PENDIENTE-1], DUI duplicado entre pruebas)

## Etapa 2 — Portada y familias

- [x] T6 Portada, ingreso y registro con la pantalla partida (`AuthShell`) y los textos de §13
- [x] T7 Marco de familias: encabezado, navegación inferior en móvil y superior en escritorio
- [x] T8 Inicio, ¿Quién se inscribe? y Mis inscripciones (con confirmación de envío)
- [x] T9 Fichas por pasos (`FichaShell`): E1 al tocar Siguiente, E2 al volver, E3 con errores del servidor
- [x] T10 Etiquetas asociadas a todos los campos (A8) y firma con tokens
- [x] T11 R9 en `lib/validators.ts`, cliente, datos de prueba y POM (A7); pruebas A13
- [x] T12 Verificación: tsc y lint limpios; E2E 11/12 (la falla es [PENDIENTE-1]); 360 px sin desplazamiento horizontal y áreas tocables ≥ 44 px en las 18 vistas

## Etapa 3 — Panel admin

- [x] T13 Layout con `AdminSidebar` (se apila arriba en teléfono, E5)
- [x] T14 Resumen con KPIs y listado con filtros, chips de estado y rama, acciones y exportación
- [x] T15 Revisión: encabezado con estado, motivo de rechazo en panel lateral y ficha editable en modo admin
- [x] T16 Verificación: tsc y lint limpios; sin desbordamiento a 1440 y 360 px; E2E 11/12 ([PENDIENTE-1])
- [x] T17 Sincronización: `AGENTS.md` §5.3, §6, §7, §8 e inventario (C10, A12)
