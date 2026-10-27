-- 0003_adult_rama_roles.sql
-- Aplica en Supabase Dashboard > SQL Editor (proyecto de PRODUCCIÓN).
-- Agrega los roles internos de rama del Adulto Voluntario.
-- Idempotente.

ALTER TABLE public.adult_forms
  ADD COLUMN IF NOT EXISTS responsable_rama boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asistente_rama boolean NOT NULL DEFAULT false;

-- Verificación:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'adult_forms' AND column_name LIKE '%_rama';
