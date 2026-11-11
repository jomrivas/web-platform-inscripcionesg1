-- 0002_approved_status.sql
-- Aplica en Supabase Dashboard > SQL Editor (proyecto de PRODUCCIÓN).
-- 1. Permite el estado 'approved' en inscriptions.status (flujo de aprobación admin).
-- 2. Agrega la columna 'rama' a la vista inscriptions_summary (filtros por rama).
-- Idempotente: puede ejecutarse más de una vez sin error.

-- ── 1. Ampliar check constraint de status ───────────────────────────────────
DO $$
DECLARE
  cname text;
BEGIN
  -- Eliminar checks previos sobre status (nombres desconocidos: se detectan por catálogo)
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.inscriptions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.inscriptions DROP CONSTRAINT %I', cname);
  END LOOP;

  ALTER TABLE public.inscriptions DROP CONSTRAINT IF EXISTS inscriptions_status_check_v2;

  ALTER TABLE public.inscriptions
    ADD CONSTRAINT inscriptions_status_check_v2
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
END
$$;

-- ── 2. Vista resumen con columna rama ───────────────────────────────────────
-- (conserva todas las columnas previas + agrega 'rama' para filtros admin)
CREATE OR REPLACE VIEW public.inscriptions_summary
WITH (security_invoker = true) AS
SELECT
  i.id,
  i.user_id,
  i.type,
  i.inscription_year,
  i.status,
  i.rejection_reason,
  i.submitted_at,
  i.created_at,
  i.updated_at,
  COALESCE(a.nombre_completo, b.nombre_completo) AS nombre,
  COALESCE(a.nombre_completo, b.nombre_completo) AS nombre_completo,
  COALESCE(a.dui, b.dui_numero) AS identificacion,
  COALESCE(a.dui, b.dui_numero) AS dui,
  COALESCE(a.email, b.email, b.madre_email, b.padre_email) AS email_contacto,
  COALESCE(a.email, b.email, b.madre_email, b.padre_email) AS email,
  COALESCE(a.rama, b.rama_inscripcion) AS rama
FROM public.inscriptions i
LEFT JOIN public.adult_forms a ON a.inscription_id = i.id
LEFT JOIN public.beneficiary_forms b ON b.inscription_id = i.id;

-- Verificación rápida (ejecutar después de aplicar):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.inscriptions'::regclass AND contype = 'c';
