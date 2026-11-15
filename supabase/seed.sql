-- ============================================================================
-- seed.sql — datos semilla para el entorno LOCAL únicamente
-- Lo corre `supabase db reset` después de aplicar las migraciones.
--
-- NUNCA contiene datos reales, ni siquiera anonimizados. Todo lleva el prefijo
-- E2E_TEST_ para que el teardown de la suite pueda limpiarlo sin ambigüedad.
-- ============================================================================

-- Nota sobre usuarios: crear filas en auth.users a mano es frágil, porque
-- Supabase Auth espera columnas internas (contraseña cifrada, confirmaciones,
-- identidades) que cambian entre versiones. Los usuarios de prueba se crean
-- con la Admin API desde scripts/seed-users.mjs.
--
-- Los usuarios Y sus roles los crea scripts/seed-users.mjs, que corre
-- después del reset con:  npm run db:reset
-- Este archivo queda para datos semilla que no dependan de auth.users.

-- Verificación rápida tras `supabase db reset`:
--   select u.email, r.role from public.user_roles r
--   join auth.users u on u.id = r.user_id;
