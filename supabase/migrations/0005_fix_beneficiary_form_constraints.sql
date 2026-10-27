-- 0005_fix_beneficiary_form_constraints.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Corrige CHECK constraints de beneficiary_forms que impedirían guardar la
-- ficha cuando se usen los campos equivalentes a los del Adulto.
--
-- Estado de la base viva:
--   * emergencia_trasladar_a → ROTO: solo acepta NULL (rechaza CUALQUIER
--     texto, igual que en adult_forms). Se elimina el constraint.
--   * vive_con               → enum válido: 'madre' | 'padre' | 'otros'
--   * estado_civil_padres    → enum válido: 'casados' | 'divorciados' |
--                              'viudos' | 'union_libre' | 'separados'
--     (si el formulario llegara a ofrecer otros valores, extender estos
--      enums en una migración posterior)
--
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
-- ─────────────────────────────────────────────────────────────────────────────

-- Traslado en emergencia: debe aceptar texto libre (hospital, clínica, etc.)
ALTER TABLE beneficiary_forms
  DROP CONSTRAINT IF EXISTS beneficiary_forms_emergencia_trasladar_a_check;
