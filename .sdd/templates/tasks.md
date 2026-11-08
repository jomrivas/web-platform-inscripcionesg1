---
spec: NNN
estado: pendiente         # pendiente | en-curso | completado
---

# NNN — Tareas

Cada tarea es atómica, tiene un criterio de verificación y se puede dejar a
medias sin romper `main`. Si una tarea no se puede verificar, está mal escrita.

## Fase 1 — Base de datos

- [ ] **T1.1** Escribir migración `NNNN_descripcion.sql`
  - *Verificación:* `mcp Supabase apply_migration` corre sin error; `list_tables` muestra el cambio
- [ ] **T1.2** Políticas RLS de las tablas afectadas
  - *Verificación:* `get_advisors` no reporta tabla sin RLS ni vista `SECURITY DEFINER`

## Fase 2 — Servidor

- [ ] **T2.1** Validadores en `lib/validators.ts`
  - *Verificación:* …
- [ ] **T2.2** Route handler
  - *Verificación:* responde los códigos de §4 del plan para cada caso

## Fase 3 — UI

- [ ] **T3.1** …
  - *Verificación:* …

## Fase 4 — Pruebas

- [ ] **T4.1** Page Object
  - *Verificación:* no hay selectores crudos en el spec
- [ ] **T4.2** Spec E2E que cubre A1…An
  - *Verificación:* `npm run test:e2e` pasa en verde

## Fase 5 — Cierre

- [ ] **T5.1** Actualizar `AGENTS.md` (secciones: …)
- [ ] **T5.2** Actualizar `.sdd/baseline/inventario.md`
- [ ] **T5.3** Marcar la spec como `cerrada`
- [ ] **T5.4** Commit y PR

## Bitácora

| Fecha | Tarea | Nota |
|---|---|---|
