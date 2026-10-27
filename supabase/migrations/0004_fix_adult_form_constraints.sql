-- 0004_fix_adult_form_constraints.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Corrige CHECK constraints de adult_forms que estaban desalineados con las
-- opciones reales del formulario (o directamente rotos). La base viva tenía:
--   * tipo_ficha        → solo aceptaba 'renovacion'
--   * rama              → solo aceptaba 'manada' / 'clan'
--   * estado_civil      → no aceptaba 'union_libre'
--   * emergencia_trasladar_a → solo aceptaba NULL (rechazaba CUALQUIER texto;
--     el constraint estaba roto e impedía guardar la ficha)
--
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
-- ─────────────────────────────────────────────────────────────────────────────

-- Tipo de ficha: valores del formulario (Nueva / Reingreso / Actualización)
ALTER TABLE adult_forms DROP CONSTRAINT IF EXISTS adult_forms_tipo_ficha_check;
ALTER TABLE adult_forms ADD CONSTRAINT adult_forms_tipo_ficha_check
  CHECK (
    tipo_ficha IS NULL
    OR tipo_ficha IN ('nueva', 'reingreso', 'actualizacion', 'renovacion')
  );

-- Estado civil: agrega 'union_libre' a los valores existentes
ALTER TABLE adult_forms DROP CONSTRAINT IF EXISTS adult_forms_estado_civil_check;
ALTER TABLE adult_forms ADD CONSTRAINT adult_forms_estado_civil_check
  CHECK (
    estado_civil IS NULL
    OR estado_civil IN ('soltero', 'casado', 'divorciado', 'viudo', 'union_libre')
  );

-- Rama: es texto libre (datalist con sugerencias) → se elimina el constraint
ALTER TABLE adult_forms DROP CONSTRAINT IF EXISTS adult_forms_rama_check;

-- Traslado en emergencia: debe aceptar texto libre (hospital, clínica, etc.)
ALTER TABLE adult_forms DROP CONSTRAINT IF EXISTS adult_forms_emergencia_trasladar_a_check;
